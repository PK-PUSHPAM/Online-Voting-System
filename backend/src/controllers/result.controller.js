import mongoose from "mongoose";
import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import getElectionStatus from "../utils/getElectionStatus.js";

const buildRankedResultsForElection = async (electionId) => {
  const [posts, candidates, voteCounts] = await Promise.all([
    Post.find({ electionId }).sort({ displayOrder: 1, createdAt: 1 }),
    Candidate.find({ electionId })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean(),
    Vote.aggregate([
      {
        $match: {
          electionId: new mongoose.Types.ObjectId(electionId),
        },
      },
      {
        $group: {
          _id: {
            postId: "$postId",
            candidateId: "$candidateId",
          },
          totalVotes: { $sum: 1 },
        },
      },
    ]),
  ]);

  const voteMap = new Map(
    voteCounts.map((item) => [
      `${item._id.postId.toString()}::${item._id.candidateId.toString()}`,
      item.totalVotes,
    ]),
  );

  const candidatesByPost = new Map();

  for (const candidate of candidates) {
    const key = candidate.postId.toString();

    if (!candidatesByPost.has(key)) {
      candidatesByPost.set(key, []);
    }

    candidatesByPost.get(key).push({
      _id: candidate._id,
      fullName: candidate.fullName,
      partyName: candidate.partyName,
      candidatePhotoUrl: candidate.candidatePhotoUrl,
      isApproved: candidate.isApproved,
      approvalStatus: candidate.approvalStatus,
      isActive: candidate.isActive,
      displayOrder: candidate.displayOrder ?? 0,
      totalVotes: voteMap.get(`${key}::${candidate._id.toString()}`) || 0,
    });
  }

  const finalResults = posts.map((post) => {
    const postKey = post._id.toString();

    const postCandidates = (candidatesByPost.get(postKey) || [])
      .filter(
        (candidate) =>
          candidate.isApproved && candidate.approvalStatus === "approved",
      )
      .sort((a, b) => {
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }

        if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        }

        return a.fullName.localeCompare(b.fullName);
      });

    const totalVotesCastForPost = postCandidates.reduce(
      (sum, candidate) => sum + candidate.totalVotes,
      0,
    );

    let winner = null;
    let isTie = false;
    let tiedCandidates = [];

    if (postCandidates.length > 0) {
      const highestVotes = postCandidates[0].totalVotes;
      tiedCandidates = postCandidates.filter(
        (candidate) => candidate.totalVotes === highestVotes,
      );

      if (highestVotes > 0 && tiedCandidates.length === 1) {
        winner = tiedCandidates[0];
      } else if (highestVotes > 0 && tiedCandidates.length > 1) {
        isTie = true;
      }
    }

    return {
      post: {
        _id: post._id,
        title: post.title,
        description: post.description,
        maxVotesPerVoter: post.maxVotesPerVoter,
        isActive: post.isActive,
        displayOrder: post.displayOrder,
      },
      totalVotesCastForPost,
      candidates: postCandidates,
      winner,
      isTie,
      tiedCandidates: isTie ? tiedCandidates : [],
    };
  });

  return {
    totalPosts: posts.length,
    results: finalResults,
  };
};

export const getElectionResultsForAdmin = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(electionId)) {
    throw new ApiError(400, "Invalid electionId");
  }

  const election = await Election.findById(electionId).populate(
    "createdBy",
    "fullName email role",
  );

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const computedStatus = getElectionStatus(
    election.startDate,
    election.endDate,
  );

  if (election.status !== computedStatus) {
    election.status = computedStatus;
    await election.save({ validateBeforeSave: false });
  }

  const { totalPosts, results } =
    await buildRankedResultsForElection(electionId);

  const totalVotesCast = results.reduce(
    (sum, item) => sum + item.totalVotesCastForPost,
    0,
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        election: {
          _id: election._id,
          title: election.title,
          description: election.description,
          startDate: election.startDate,
          endDate: election.endDate,
          status: election.status,
          isPublished: election.isPublished,
          allowedVoterType: election.allowedVoterType,
          createdBy: election.createdBy,
        },
        totalPosts,
        totalVotesCast,
        isFinalResult: election.status === "ended",
        results,
      },
      election.status === "ended"
        ? "Final election results fetched successfully"
        : "Provisional election results fetched successfully",
    ),
  );
});

export const getPostResultForAdmin = asyncHandler(async (req, res) => {
  const { electionId, postId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(electionId) ||
    !mongoose.Types.ObjectId.isValid(postId)
  ) {
    throw new ApiError(400, "Invalid electionId or postId");
  }

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const computedStatus = getElectionStatus(
    election.startDate,
    election.endDate,
  );

  if (election.status !== computedStatus) {
    election.status = computedStatus;
    await election.save({ validateBeforeSave: false });
  }

  const post = await Post.findOne({ _id: postId, electionId });

  if (!post) {
    throw new ApiError(404, "Post not found in this election");
  }

  const candidates = await Candidate.find({
    electionId,
    postId,
    isApproved: true,
    approvalStatus: "approved",
  })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  const voteCounts = await Vote.aggregate([
    {
      $match: {
        electionId: new mongoose.Types.ObjectId(electionId),
        postId: new mongoose.Types.ObjectId(postId),
      },
    },
    {
      $group: {
        _id: "$candidateId",
        totalVotes: { $sum: 1 },
      },
    },
  ]);

  const voteCountMap = new Map(
    voteCounts.map((item) => [item._id.toString(), item.totalVotes]),
  );

  const candidatesWithVotes = candidates
    .map((candidate) => ({
      _id: candidate._id,
      fullName: candidate.fullName,
      partyName: candidate.partyName,
      candidatePhotoUrl: candidate.candidatePhotoUrl,
      isActive: candidate.isActive,
      totalVotes: voteCountMap.get(candidate._id.toString()) || 0,
      displayOrder: candidate.displayOrder ?? 0,
    }))
    .sort((a, b) => {
      if (b.totalVotes !== a.totalVotes) {
        return b.totalVotes - a.totalVotes;
      }

      if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      }

      return a.fullName.localeCompare(b.fullName);
    });

  let winner = null;
  let isTie = false;
  let tiedCandidates = [];

  if (candidatesWithVotes.length > 0) {
    const highestVotes = candidatesWithVotes[0].totalVotes;
    tiedCandidates = candidatesWithVotes.filter(
      (candidate) => candidate.totalVotes === highestVotes,
    );

    if (highestVotes > 0 && tiedCandidates.length === 1) {
      winner = tiedCandidates[0];
    } else if (highestVotes > 0 && tiedCandidates.length > 1) {
      isTie = true;
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        election: {
          _id: election._id,
          title: election.title,
          status: election.status,
          isPublished: election.isPublished,
        },
        post: {
          _id: post._id,
          title: post.title,
          description: post.description,
          maxVotesPerVoter: post.maxVotesPerVoter,
          isActive: post.isActive,
        },
        totalVotesCastForPost: candidatesWithVotes.reduce(
          (sum, candidate) => sum + candidate.totalVotes,
          0,
        ),
        isFinalResult: election.status === "ended",
        candidates: candidatesWithVotes,
        winner,
        isTie,
        tiedCandidates: isTie ? tiedCandidates : [],
      },
      election.status === "ended"
        ? "Final post result fetched successfully"
        : "Provisional post result fetched successfully",
    ),
  );
});
