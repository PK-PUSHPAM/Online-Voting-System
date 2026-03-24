import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Candidate from "../models/Candidate.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import syncElectionStatus from "../utils/syncElectionStatus.js";

export const createPost = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const { title, description, maxVotesPerVoter, isActive } = req.body;

  if (!title) {
    throw new ApiError(400, "Post title is required");
  }

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  if (election.status === "ended") {
    throw new ApiError(400, "Cannot add post to an ended election");
  }

  const existingPost = await Post.findOne({
    electionId,
    title: title.trim(),
  });

  if (existingPost) {
    throw new ApiError(
      409,
      "Post with this title already exists in this election",
    );
  }

  const post = await Post.create({
    electionId,
    title: title.trim(),
    description: description?.trim() || "",
    maxVotesPerVoter:
      maxVotesPerVoter && Number(maxVotesPerVoter) > 0
        ? Number(maxVotesPerVoter)
        : 1,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully"));
});

export const getPostsByElection = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const posts = await Post.find({ electionId }).sort({ createdAt: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: posts.length,
        posts,
      },
      "Posts fetched successfully",
    ),
  );
});

export const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId).populate(
    "electionId",
    "title status startDate endDate",
  );

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetched successfully"));
});

export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { title, description, maxVotesPerVoter, isActive } = req.body;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const election = await Election.findById(post.electionId);

  if (!election) {
    throw new ApiError(404, "Parent election not found");
  }

  if (election.status === "ended") {
    throw new ApiError(400, "Cannot update post of an ended election");
  }

  if (title && title.trim() !== post.title) {
    const titleExists = await Post.findOne({
      electionId: post.electionId,
      title: title.trim(),
      _id: { $ne: postId },
    });

    if (titleExists) {
      throw new ApiError(
        409,
        "Another post with this title already exists in this election",
      );
    }

    post.title = title.trim();
  }

  if (description !== undefined) {
    post.description = description?.trim() || "";
  }

  if (maxVotesPerVoter !== undefined) {
    const parsed = Number(maxVotesPerVoter);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new ApiError(
        400,
        "maxVotesPerVoter must be an integer greater than or equal to 1",
      );
    }

    post.maxVotesPerVoter = parsed;
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
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const election = await Election.findById(post.electionId);

  if (!election) {
    throw new ApiError(404, "Parent election not found");
  }

  if (election.status === "active") {
    throw new ApiError(400, "Cannot delete post from an active election");
  }

  if (election.status === "ended") {
    throw new ApiError(400, "Cannot delete post from an ended election");
  }

  await Post.findByIdAndDelete(postId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully"));
});

export const getActivePostsWithCandidatesForElection = asyncHandler(
  async (req, res) => {
    const { electionId } = req.params;

    let election = await Election.findById(electionId);

    if (!election) {
      throw new ApiError(404, "Election not found");
    }

    election = await syncElectionStatus(election);

    if (election.status !== "active" || !election.isPublished) {
      throw new ApiError(400, "This election is not available for voting");
    }

    const posts = await Post.find({
      electionId,
      isActive: true,
    }).sort({ createdAt: 1 });

    const postsWithCandidates = await Promise.all(
      posts.map(async (post) => {
        const candidates = await Candidate.find({
          electionId,
          postId: post._id,
          isApproved: true,
        }).select(
          "fullName partyName partySymbolUrl candidatePhotoUrl manifesto",
        );

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
          election,
          count: postsWithCandidates.length,
          posts: postsWithCandidates,
        },
        "Election posts and candidates fetched successfully",
      ),
    );
  },
);
