import mongoose from "mongoose";
import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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

  const posts = await Post.find({ electionId }).sort({ createdAt: 1 });
  const finalResults = [];

  for (const post of posts) {
    const candidates = await Candidate.find({
      electionId,
      postId: post._id,
    }).sort({ createdAt: 1 });

    const voteCounts = await Vote.aggregate([
      {
        $match: {
          electionId: new mongoose.Types.ObjectId(electionId),
          postId: post._id,
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

    const candidatesWithVotes = candidates.map((candidate) => ({
      _id: candidate._id,
      fullName: candidate.fullName,
      email: candidate.email,
      mobileNumber: candidate.mobileNumber,
      partyName: candidate.partyName,
      partySymbolUrl: candidate.partySymbolUrl,
      candidatePhotoUrl: candidate.candidatePhotoUrl,
      manifesto: candidate.manifesto,
      isApproved: candidate.isApproved,
      totalVotes: voteCountMap.get(candidate._id.toString()) || 0,
    }));

    const sortedCandidates = [...candidatesWithVotes].sort(
      (a, b) => b.totalVotes - a.totalVotes,
    );

    let winner = null;
    let isTie = false;
    let tiedCandidates = [];

    if (sortedCandidates.length > 0) {
      const highestVotes = sortedCandidates[0].totalVotes;
      tiedCandidates = sortedCandidates.filter(
        (candidate) => candidate.totalVotes === highestVotes,
      );

      if (tiedCandidates.length === 1) {
        winner = tiedCandidates[0];
      } else if (tiedCandidates.length > 1 && highestVotes > 0) {
        isTie = true;
      }
    }

    finalResults.push({
      post: {
        _id: post._id,
        title: post.title,
        description: post.description,
        maxVotesPerVoter: post.maxVotesPerVoter,
        isActive: post.isActive,
      },
      totalVotesCastForPost: sortedCandidates.reduce(
        (sum, candidate) => sum + candidate.totalVotes,
        0,
      ),
      candidates: sortedCandidates,
      winner,
      isTie,
      tiedCandidates: isTie ? tiedCandidates : [],
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        election,
        totalPosts: posts.length,
        results: finalResults,
      },
      "Election results fetched successfully",
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

  const post = await Post.findOne({ _id: postId, electionId });
  if (!post) {
    throw new ApiError(404, "Post not found in this election");
  }

  const candidates = await Candidate.find({
    electionId,
    postId,
  }).sort({ createdAt: 1 });

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
      totalVotes: voteCountMap.get(candidate._id.toString()) || 0,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes);

  let winner = null;
  let isTie = false;
  let tiedCandidates = [];

  if (candidatesWithVotes.length > 0) {
    const highestVotes = candidatesWithVotes[0].totalVotes;
    tiedCandidates = candidatesWithVotes.filter(
      (candidate) => candidate.totalVotes === highestVotes,
    );

    if (tiedCandidates.length === 1) {
      winner = tiedCandidates[0];
    } else if (tiedCandidates.length > 1 && highestVotes > 0) {
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
        },
        post,
        totalVotesCastForPost: candidatesWithVotes.reduce(
          (sum, candidate) => sum + candidate.totalVotes,
          0,
        ),
        candidates: candidatesWithVotes,
        winner,
        isTie,
        tiedCandidates: isTie ? tiedCandidates : [],
      },
      "Post result fetched successfully",
    ),
  );
});
