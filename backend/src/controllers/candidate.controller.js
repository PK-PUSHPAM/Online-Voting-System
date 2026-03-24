import Candidate from "../models/Candidate.js";
import Election from "../models/Election.js";
import Post from "../models/Post.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createCandidate = asyncHandler(async (req, res) => {
  const { electionId, postId } = req.params;
  const {
    fullName,
    email,
    mobileNumber,
    partyName,
    partySymbolUrl,
    candidatePhotoUrl,
    photoPublicId,
    manifesto,
    isApproved,
  } = req.body;

  if (!fullName) {
    throw new ApiError(400, "Candidate fullName is required");
  }

  const election = await Election.findById(electionId);
  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  if (election.status === "ended") {
    throw new ApiError(400, "Cannot add candidate to an ended election");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.electionId.toString() !== electionId) {
    throw new ApiError(400, "This post does not belong to the given election");
  }

  const existingCandidate = await Candidate.findOne({
    electionId,
    postId,
    fullName: fullName.trim(),
  });

  if (existingCandidate) {
    throw new ApiError(
      409,
      "Candidate with this name already exists for this post",
    );
  }

  const candidate = await Candidate.create({
    electionId,
    postId,
    fullName: fullName.trim(),
    email: email?.trim().toLowerCase() || "",
    mobileNumber: mobileNumber?.trim() || "",
    partyName: partyName?.trim() || "",
    partySymbolUrl: partySymbolUrl?.trim() || "",
    candidatePhotoUrl: candidatePhotoUrl?.trim() || "",
    photoPublicId: photoPublicId?.trim() || "",
    manifesto: manifesto?.trim() || "",
    isApproved: typeof isApproved === "boolean" ? isApproved : true,
    addedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, candidate, "Candidate created successfully"));
});

export const getCandidatesByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId).populate(
    "electionId",
    "title status startDate endDate",
  );

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const candidates = await Candidate.find({ postId })
    .populate("addedBy", "fullName email role")
    .sort({ createdAt: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: candidates.length,
        post,
        candidates,
      },
      "Candidates fetched successfully",
    ),
  );
});

export const getCandidatesByElection = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const candidates = await Candidate.find({ electionId })
    .populate("postId", "title description isActive")
    .populate("addedBy", "fullName email role")
    .sort({ createdAt: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: candidates.length,
        election,
        candidates,
      },
      "Candidates fetched successfully",
    ),
  );
});

export const getCandidateById = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;

  const candidate = await Candidate.findById(candidateId)
    .populate("electionId", "title status startDate endDate")
    .populate("postId", "title description isActive")
    .populate("addedBy", "fullName email role");

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, candidate, "Candidate fetched successfully"));
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const {
    fullName,
    email,
    mobileNumber,
    partyName,
    partySymbolUrl,
    candidatePhotoUrl,
    photoPublicId,
    manifesto,
    isApproved,
  } = req.body;

  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  const election = await Election.findById(candidate.electionId);

  if (!election) {
    throw new ApiError(404, "Parent election not found");
  }

  if (election.status === "ended") {
    throw new ApiError(400, "Cannot update candidate of an ended election");
  }

  if (fullName && fullName.trim() !== candidate.fullName) {
    const duplicateName = await Candidate.findOne({
      electionId: candidate.electionId,
      postId: candidate.postId,
      fullName: fullName.trim(),
      _id: { $ne: candidateId },
    });

    if (duplicateName) {
      throw new ApiError(
        409,
        "Another candidate with this name already exists for this post",
      );
    }

    candidate.fullName = fullName.trim();
  }

  if (email !== undefined) {
    candidate.email = email?.trim().toLowerCase() || "";
  }

  if (mobileNumber !== undefined) {
    candidate.mobileNumber = mobileNumber?.trim() || "";
  }

  if (partyName !== undefined) {
    candidate.partyName = partyName?.trim() || "";
  }

  if (partySymbolUrl !== undefined) {
    candidate.partySymbolUrl = partySymbolUrl?.trim() || "";
  }

  if (candidatePhotoUrl !== undefined) {
    candidate.candidatePhotoUrl = candidatePhotoUrl?.trim() || "";
  }

  if (photoPublicId !== undefined) {
    candidate.photoPublicId = photoPublicId?.trim() || "";
  }

  if (manifesto !== undefined) {
    candidate.manifesto = manifesto?.trim() || "";
  }

  if (typeof isApproved === "boolean") {
    candidate.isApproved = isApproved;
  }

  await candidate.save();

  return res
    .status(200)
    .json(new ApiResponse(200, candidate, "Candidate updated successfully"));
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;

  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  const election = await Election.findById(candidate.electionId);

  if (!election) {
    throw new ApiError(404, "Parent election not found");
  }

  if (election.status === "active") {
    throw new ApiError(400, "Cannot delete candidate from an active election");
  }

  if (election.status === "ended") {
    throw new ApiError(400, "Cannot delete candidate from an ended election");
  }

  await Candidate.findByIdAndDelete(candidateId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Candidate deleted successfully"));
});
