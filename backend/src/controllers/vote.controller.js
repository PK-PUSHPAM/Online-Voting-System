import Vote from "../models/Vote.js";
import User from "../models/User.js";
import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Candidate from "../models/Candidate.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import syncElectionStatus from "../utils/syncElectionStatus.js";

export const castVote = asyncHandler(async (req, res) => {
  const voterId = req.user._id;
  const { electionId, postId, candidateId } = req.body;

  if (!electionId || !postId || !candidateId) {
    throw new ApiError(400, "electionId, postId and candidateId are required");
  }

  const voter = await User.findById(voterId);

  if (!voter) {
    throw new ApiError(404, "Voter not found");
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

  if (voter.verificationStatus !== "approved") {
    throw new ApiError(403, "Your account is not approved by admin");
  }

  if (!voter.ageVerified || !voter.isEligibleToVote) {
    throw new ApiError(403, "You are not eligible to vote");
  }

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  election = await syncElectionStatus(election);

  if (election.status !== "active") {
    throw new ApiError(400, "Voting is allowed only in active elections");
  }

  if (!election.isPublished) {
    throw new ApiError(400, "Election is not published yet");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.electionId.toString() !== electionId) {
    throw new ApiError(400, "Post does not belong to this election");
  }

  if (!post.isActive) {
    throw new ApiError(400, "This post is not active for voting");
  }

  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  if (candidate.electionId.toString() !== electionId) {
    throw new ApiError(400, "Candidate does not belong to this election");
  }

  if (candidate.postId.toString() !== postId) {
    throw new ApiError(400, "Candidate does not belong to this post");
  }

  if (!candidate.isApproved) {
    throw new ApiError(400, "Candidate is not approved for voting");
  }

  const existingVote = await Vote.findOne({
    voterId,
    electionId,
    postId,
  });

  if (existingVote) {
    throw new ApiError(
      409,
      "You have already voted for this post in this election",
    );
  }

  const vote = await Vote.create({
    voterId,
    electionId,
    postId,
    candidateId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, vote, "Vote cast successfully"));
});

export const getMyVotes = asyncHandler(async (req, res) => {
  const voterId = req.user._id;

  const votes = await Vote.find({ voterId })
    .populate("electionId", "title status startDate endDate")
    .populate("postId", "title description")
    .populate("candidateId", "fullName partyName candidatePhotoUrl")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: votes.length,
        votes,
      },
      "Your votes fetched successfully",
    ),
  );
});

export const getVotesByElectionForAdmin = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const votes = await Vote.find({ electionId })
    .populate("voterId", "fullName email mobileNumber internalVoterId")
    .populate("postId", "title")
    .populate("candidateId", "fullName partyName")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: votes.length,
        votes,
      },
      "Election votes fetched successfully",
    ),
  );
});
