import mongoose from "mongoose";
import Vote from "../models/Vote.js";
import User from "../models/User.js";
import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Candidate from "../models/Candidate.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import getElectionStatus from "../utils/getElectionStatus.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

const validateVoterEligibility = (voter, election) => {
  if (!voter) {
    throw new ApiError(404, "Voter not found");
  }

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  if (voter.role !== "voter") {
    throw new ApiError(403, "Only voters can cast votes");
  }

  if (!voter.isActive) {
    throw new ApiError(403, "Your account is inactive");
  }

  if (!voter.mobileVerified) {
    throw new ApiError(403, "Mobile number is not verified");
  }

  if (!voter.ageVerified || !voter.isEligibleToVote) {
    throw new ApiError(403, "You are not eligible to vote");
  }

  if (
    election.allowedVoterType === "verifiedOnly" &&
    voter.verificationStatus !== "approved"
  ) {
    throw new ApiError(403, "Your account is not approved by admin");
  }
};

export const castVote = asyncHandler(async (req, res) => {
  const voterId = req.user._id;
  const { body } = req.validatedData || { body: req.body };
  const { electionId, postId, candidateId } = body;

  const session = await mongoose.startSession();

  try {
    let responseData = null;

    await session.withTransaction(async () => {
      const [voter, election, post, candidate] = await Promise.all([
        User.findById(voterId).session(session),
        Election.findById(electionId).session(session),
        Post.findOne({ _id: postId, electionId }).session(session),
        Candidate.findOne({
          _id: candidateId,
          electionId,
          postId,
          isActive: true,
        }).session(session),
      ]);

      validateVoterEligibility(voter, election);

      const computedElectionStatus = getElectionStatus(
        election.startDate,
        election.endDate,
      );

      if (election.status !== computedElectionStatus) {
        election.status = computedElectionStatus;
        await election.save({ validateBeforeSave: false, session });
      }

      if (election.status !== "active") {
        throw new ApiError(400, "Voting is allowed only in active elections");
      }

      if (!election.isPublished) {
        throw new ApiError(400, "Election is not published yet");
      }

      if (!post) {
        throw new ApiError(404, "Post not found in this election");
      }

      if (!post.isActive) {
        throw new ApiError(400, "This post is not active for voting");
      }

      if (!candidate) {
        throw new ApiError(404, "Candidate not found for this post");
      }

      if (!candidate.isApproved || candidate.approvalStatus !== "approved") {
        throw new ApiError(400, "Candidate is not approved for voting");
      }

      const votesAlreadyCastForPost = await Vote.countDocuments({
        voterId,
        electionId,
        postId,
      }).session(session);

      if (votesAlreadyCastForPost >= post.maxVotesPerVoter) {
        throw new ApiError(
          409,
          `You can vote only ${post.maxVotesPerVoter} time(s) for this post`,
        );
      }

      const existingSameCandidateVote = await Vote.findOne({
        voterId,
        electionId,
        postId,
        candidateId,
      })
        .select("_id")
        .session(session);

      if (existingSameCandidateVote) {
        throw new ApiError(
          409,
          "You have already voted for this candidate in this post",
        );
      }

      const [createdVote] = await Vote.create(
        [
          {
            voterId,
            electionId,
            postId,
            candidateId,
          },
        ],
        { session },
      );

      responseData = {
        vote: createdVote,
        voteSummary: {
          electionId,
          postId,
          candidateId,
          votesUsedForThisPost: votesAlreadyCastForPost + 1,
          votesRemainingForThisPost:
            post.maxVotesPerVoter - (votesAlreadyCastForPost + 1),
          maxVotesPerVoter: post.maxVotesPerVoter,
        },
      };
    });

    return res
      .status(201)
      .json(new ApiResponse(201, responseData, "Vote cast successfully"));
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        "Duplicate vote detected. You already voted for this candidate.",
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

export const getMyVotes = asyncHandler(async (req, res) => {
  const voterId = req.user._id;
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip, sort } = buildPagination(query);

  const [totalItems, votes] = await Promise.all([
    Vote.countDocuments({ voterId }),
    Vote.find({ voterId })
      .populate("electionId", "title status startDate endDate isPublished")
      .populate("postId", "title description maxVotesPerVoter")
      .populate("candidateId", "fullName partyName candidatePhotoUrl")
      .sort(sort)
      .skip(skip)
      .limit(limit),
  ]);

  const pagination = buildPaginationResponse({
    totalItems,
    page,
    limit,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { items: votes, pagination },
        "Your votes fetched successfully",
      ),
    );
});

export const getVotesByElectionForAdmin = asyncHandler(async (req, res) => {
  const { params, query } = req.validatedData || {
    params: req.params,
    query: req.query,
  };

  const { electionId } = params;
  const { page, limit } = buildPagination(query);

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const [posts, aggregateResults] = await Promise.all([
    Post.find({ electionId })
      .select("title maxVotesPerVoter displayOrder")
      .sort({
        displayOrder: 1,
        createdAt: 1,
      }),
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
      {
        $lookup: {
          from: "candidates",
          localField: "_id.candidateId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      {
        $unwind: "$candidate",
      },
      {
        $project: {
          _id: 0,
          postId: "$_id.postId",
          candidateId: "$_id.candidateId",
          totalVotes: 1,
          candidateFullName: "$candidate.fullName",
          partyName: "$candidate.partyName",
          approvalStatus: "$candidate.approvalStatus",
          isActive: "$candidate.isActive",
          displayOrder: "$candidate.displayOrder",
        },
      },
      {
        $sort: {
          postId: 1,
          totalVotes: -1,
          displayOrder: 1,
          candidateFullName: 1,
        },
      },
    ]),
  ]);

  const postMap = new Map(
    posts.map((post) => [
      String(post._id),
      {
        postId: post._id,
        title: post.title,
        maxVotesPerVoter: post.maxVotesPerVoter,
        displayOrder: post.displayOrder,
        candidates: [],
        totalVotesCast: 0,
      },
    ]),
  );

  for (const row of aggregateResults) {
    const key = String(row.postId);
    if (!postMap.has(key)) continue;

    postMap.get(key).candidates.push({
      candidateId: row.candidateId,
      fullName: row.candidateFullName,
      partyName: row.partyName,
      totalVotes: row.totalVotes,
      approvalStatus: row.approvalStatus,
      isActive: row.isActive,
    });

    postMap.get(key).totalVotesCast += row.totalVotes;
  }

  const allItems = Array.from(postMap.values()).sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const totalItems = allItems.length;
  const startIndex = (page - 1) * limit;
  const items = allItems.slice(startIndex, startIndex + limit);

  const pagination = buildPaginationResponse({
    totalItems,
    page,
    limit,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        pagination,
      },
      "Election vote summary fetched successfully",
    ),
  );
});
