import Post from "../models/Post.js";
import Election from "../models/Election.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import getElectionStatus from "../utils/getElectionStatus.js";
import syncElectionStatus from "../utils/syncElectionStatus.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

const ensureUpcomingElection = (election) => {
  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const status = getElectionStatus(election.startDate, election.endDate);

  if (status !== "upcoming") {
    throw new ApiError(
      400,
      "Posts can be created, updated, or deleted only for upcoming elections",
    );
  }

  return status;
};

const canVoterAccessElection = ({ election, voter }) => {
  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  if (!election.isPublished) {
    throw new ApiError(403, "Election is not published for voters");
  }

  if (!["upcoming", "active"].includes(election.status)) {
    throw new ApiError(403, "This election is not available for voters");
  }

  if (
    election.allowedVoterType === "verifiedOnly" &&
    voter?.verificationStatus !== "approved"
  ) {
    throw new ApiError(
      403,
      "Your account is not approved to view this election",
    );
  }
};

export const createPost = asyncHandler(async (req, res) => {
  const { body, params } = req.validatedData || {
    body: req.body,
    params: req.params,
  };

  const { title, description, maxVotesPerVoter, displayOrder, isActive } = body;
  const { electionId } = params;

  const election = await Election.findById(electionId);

  ensureUpcomingElection(election);

  const existingPost = await Post.findOne({
    electionId,
    title: title.trim(),
  }).select("_id");

  if (existingPost) {
    throw new ApiError(
      409,
      "A post with this title already exists in this election",
    );
  }

  const post = await Post.create({
    electionId,
    title: title.trim(),
    description: description?.trim() || "",
    maxVotesPerVoter,
    displayOrder: displayOrder ?? 0,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully"));
});

export const getPostsByElection = asyncHandler(async (req, res) => {
  const { params, query } = req.validatedData || {
    params: req.params,
    query: req.query,
  };

  const { electionId } = params;
  const { page, limit, skip, sort } = buildPagination(query);

  const election = await Election.findById(electionId).select("_id");
  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const filter = { electionId };

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  const [totalItems, posts] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter).sort(sort).skip(skip).limit(limit),
  ]);

  const pagination = buildPaginationResponse({
    totalItems,
    page,
    limit,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: posts,
        pagination,
      },
      "Posts fetched successfully",
    ),
  );
});

export const getPostById = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { postId } = params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetched successfully"));
});

export const updatePost = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };

  const { postId } = params;
  const { title, description, maxVotesPerVoter, displayOrder, isActive } = body;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const election = await Election.findById(post.electionId);
  ensureUpcomingElection(election);

  if (title && title.trim() !== post.title) {
    const duplicateTitle = await Post.findOne({
      electionId: post.electionId,
      title: title.trim(),
      _id: { $ne: postId },
    }).select("_id");

    if (duplicateTitle) {
      throw new ApiError(409, "Another post with this title already exists");
    }
  }

  post.title = title?.trim() || post.title;
  post.description = description?.trim() ?? post.description;

  if (typeof maxVotesPerVoter === "number") {
    const existingVotesCount = await Vote.countDocuments({
      electionId: post.electionId,
      postId: post._id,
    });

    if (existingVotesCount > 0 && maxVotesPerVoter !== post.maxVotesPerVoter) {
      throw new ApiError(
        400,
        "maxVotesPerVoter can not be changed after voting data exists",
      );
    }

    post.maxVotesPerVoter = maxVotesPerVoter;
  }

  if (typeof displayOrder === "number") {
    post.displayOrder = displayOrder;
  }

  if (typeof isActive === "boolean") {
    post.isActive = isActive;
  }

  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post updated successfully"));
});

export const deletePost = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { postId } = params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const election = await Election.findById(post.electionId);
  ensureUpcomingElection(election);

  const [candidateCount, voteCount] = await Promise.all([
    Candidate.countDocuments({ postId: post._id }),
    Vote.countDocuments({ postId: post._id }),
  ]);

  if (candidateCount > 0 || voteCount > 0) {
    throw new ApiError(
      400,
      "Post cannot be deleted because related candidates or votes already exist",
    );
  }

  await Post.findByIdAndDelete(postId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully"));
});

export const getVisiblePostsWithCandidatesForVoter = asyncHandler(
  async (req, res) => {
    const { params } = req.validatedData || { params: req.params };
    const { electionId } = params;

    let election = await Election.findById(electionId);

    if (!election) {
      throw new ApiError(404, "Election not found");
    }

    election = await syncElectionStatus(election);

    canVoterAccessElection({
      election,
      voter: req.user,
    });

    const posts = await Post.find({
      electionId,
      isActive: true,
    }).sort({
      displayOrder: 1,
      createdAt: 1,
    });

    const postsWithCandidates = await Promise.all(
      posts.map(async (post) => {
        const candidates = await Candidate.find({
          electionId,
          postId: post._id,
          isActive: true,
          isApproved: true,
          approvalStatus: "approved",
        })
          .select("-__v")
          .sort({
            fullName: 1,
            createdAt: 1,
          });

        return {
          ...post.toObject(),
          candidates,
        };
      }),
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
          },
          canVoteNow: election.status === "active",
          posts: postsWithCandidates,
        },
        election.status === "active"
          ? "Active election posts with candidates fetched successfully"
          : "Upcoming election posts with candidates fetched successfully",
      ),
    );
  },
);
