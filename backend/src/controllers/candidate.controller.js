import Candidate from "../models/Candidate.js";
import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Vote from "../models/Vote.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import getElectionStatus from "../utils/getElectionStatus.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    ""
  );
};

const createAuditLog = async ({
  req,
  actorId = null,
  actorRole = "unknown",
  action,
  targetType = "",
  targetId = null,
  status = "success",
  meta = {},
}) => {
  try {
    await AuditLog.create({
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      status,
      ipAddress: getClientIp(req),
      userAgent: req.get("user-agent") || "",
      meta,
    });
  } catch (error) {
    console.warn(`Audit log creation failed for ${action}: ${error.message}`);
  }
};

const ensureUpcomingElection = (election) => {
  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const status = getElectionStatus(election.startDate, election.endDate);

  if (status !== "upcoming") {
    throw new ApiError(
      400,
      "Candidates can be created, updated, approved, or deleted only for upcoming elections",
    );
  }

  return status;
};

export const createCandidate = asyncHandler(async (req, res) => {
  const { body, params } = req.validatedData || {
    body: req.body,
    params: req.params,
  };
  const {
    userId,
    fullName,
    partyName,
    manifesto,
    candidatePhotoUrl,
    candidatePhotoPublicId,
    displayOrder,
    isActive,
  } = body;

  const { electionId, postId } = params;

  const [election, post, linkedUser] = await Promise.all([
    Election.findById(electionId),
    Post.findOne({ _id: postId, electionId }),
    userId ? User.findById(userId).select("_id role isActive") : null,
  ]);

  ensureUpcomingElection(election);

  if (!post) {
    throw new ApiError(404, "Post not found in this election");
  }

  if (linkedUser) {
    if (!linkedUser.isActive) {
      throw new ApiError(400, "Linked user is inactive");
    }

    if (!["voter", "admin"].includes(linkedUser.role)) {
      throw new ApiError(
        400,
        "Linked user role is invalid for candidate creation",
      );
    }
  }

  const duplicateCandidate = await Candidate.findOne({
    electionId,
    postId,
    fullName: fullName.trim(),
  }).select("_id");

  if (duplicateCandidate) {
    throw new ApiError(
      409,
      "A candidate with this full name already exists for this post",
    );
  }

  if (userId) {
    const duplicateUserCandidate = await Candidate.findOne({
      electionId,
      postId,
      userId,
    }).select("_id");

    if (duplicateUserCandidate) {
      throw new ApiError(
        409,
        "This user is already registered as a candidate for this post",
      );
    }
  }

  const candidate = await Candidate.create({
    electionId,
    postId,
    userId: userId || null,
    fullName: fullName.trim(),
    partyName: partyName?.trim() || "",
    manifesto: manifesto?.trim() || "",
    candidatePhotoUrl: candidatePhotoUrl?.trim() || "",
    candidatePhotoPublicId: candidatePhotoPublicId?.trim() || "",
    displayOrder: displayOrder ?? 0,
    isActive: typeof isActive === "boolean" ? isActive : true,
    isApproved: false,
    approvalStatus: "pending",
    approvedBy: null,
    approvedAt: null,
    rejectionReason: "",
  });

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "candidate.create",
    targetType: "Candidate",
    targetId: candidate._id,
    status: "success",
    meta: {
      electionId,
      postId,
      userId: userId || null,
      fullName: candidate.fullName,
      partyName: candidate.partyName,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, candidate, "Candidate created successfully"));
});

export const getCandidatesByPost = asyncHandler(async (req, res) => {
  const { params, query } = req.validatedData || {
    params: req.params,
    query: req.query,
  };

  const { postId } = params;
  const { page, limit, skip, sort } = buildPagination(query);

  const post = await Post.findById(postId).select("_id");
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const filter = { postId };

  if (query.approvalStatus) {
    filter.approvalStatus = query.approvalStatus;
  }

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  const [totalItems, candidates] = await Promise.all([
    Candidate.countDocuments(filter),
    Candidate.find(filter)
      .populate("userId", "fullName email mobileNumber")
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
        { items: candidates, pagination },
        "Candidates fetched successfully",
      ),
    );
});

export const getCandidatesByElection = asyncHandler(async (req, res) => {
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

  if (query.approvalStatus) {
    filter.approvalStatus = query.approvalStatus;
  }

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  const [totalItems, candidates] = await Promise.all([
    Candidate.countDocuments(filter),
    Candidate.find(filter)
      .populate("userId", "fullName email mobileNumber")
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
        { items: candidates, pagination },
        "Candidates fetched successfully",
      ),
    );
});

export const getCandidateById = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { candidateId } = params;

  const candidate = await Candidate.findById(candidateId).populate(
    "userId",
    "fullName email mobileNumber",
  );

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, candidate, "Candidate fetched successfully"));
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };

  const { candidateId } = params;
  const {
    fullName,
    partyName,
    manifesto,
    candidatePhotoUrl,
    candidatePhotoPublicId,
    displayOrder,
    isActive,
  } = body;

  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  const oldState = {
    fullName: candidate.fullName,
    partyName: candidate.partyName,
    manifesto: candidate.manifesto,
    candidatePhotoUrl: candidate.candidatePhotoUrl,
    candidatePhotoPublicId: candidate.candidatePhotoPublicId,
    displayOrder: candidate.displayOrder,
    isActive: candidate.isActive,
    approvalStatus: candidate.approvalStatus,
    isApproved: candidate.isApproved,
  };

  const election = await Election.findById(candidate.electionId);
  ensureUpcomingElection(election);

  if (fullName && fullName.trim() !== candidate.fullName) {
    const duplicateCandidate = await Candidate.findOne({
      electionId: candidate.electionId,
      postId: candidate.postId,
      fullName: fullName.trim(),
      _id: { $ne: candidateId },
    }).select("_id");

    if (duplicateCandidate) {
      throw new ApiError(
        409,
        "Another candidate with this full name already exists for this post",
      );
    }
  }

  candidate.fullName = fullName?.trim() || candidate.fullName;
  candidate.partyName = partyName?.trim() ?? candidate.partyName;
  candidate.manifesto = manifesto?.trim() ?? candidate.manifesto;
  candidate.candidatePhotoUrl =
    candidatePhotoUrl?.trim() ?? candidate.candidatePhotoUrl;
  candidate.candidatePhotoPublicId =
    candidatePhotoPublicId?.trim() ?? candidate.candidatePhotoPublicId;

  if (typeof displayOrder === "number") {
    candidate.displayOrder = displayOrder;
  }

  if (typeof isActive === "boolean") {
    candidate.isActive = isActive;
  }

  await candidate.save();

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "candidate.update",
    targetType: "Candidate",
    targetId: candidate._id,
    status: "success",
    meta: {
      before: oldState,
      after: {
        fullName: candidate.fullName,
        partyName: candidate.partyName,
        manifesto: candidate.manifesto,
        candidatePhotoUrl: candidate.candidatePhotoUrl,
        candidatePhotoPublicId: candidate.candidatePhotoPublicId,
        displayOrder: candidate.displayOrder,
        isActive: candidate.isActive,
        approvalStatus: candidate.approvalStatus,
        isApproved: candidate.isApproved,
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, candidate, "Candidate updated successfully"));
});

export const approveCandidate = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };

  const { candidateId } = params;
  const { action, rejectionReason } = body;

  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  const election = await Election.findById(candidate.electionId);
  ensureUpcomingElection(election);

  const oldState = {
    isApproved: candidate.isApproved,
    approvalStatus: candidate.approvalStatus,
    rejectionReason: candidate.rejectionReason,
    approvedBy: candidate.approvedBy,
    approvedAt: candidate.approvedAt,
  };

  if (action === "approve") {
    candidate.isApproved = true;
    candidate.approvalStatus = "approved";
    candidate.approvedBy = req.user._id;
    candidate.approvedAt = new Date();
    candidate.rejectionReason = "";
    candidate.isActive = true;
  } else if (action === "reject") {
    candidate.isApproved = false;
    candidate.approvalStatus = "rejected";
    candidate.approvedBy = req.user._id;
    candidate.approvedAt = new Date();
    candidate.rejectionReason = rejectionReason?.trim() || "Rejected by admin";
  } else {
    throw new ApiError(400, "Invalid action");
  }

  await candidate.save();

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "candidate.approval_update",
    targetType: "Candidate",
    targetId: candidate._id,
    status: "success",
    meta: {
      before: oldState,
      after: {
        isApproved: candidate.isApproved,
        approvalStatus: candidate.approvalStatus,
        rejectionReason: candidate.rejectionReason,
        approvedBy: candidate.approvedBy,
        approvedAt: candidate.approvedAt,
      },
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        candidate,
        "Candidate approval updated successfully",
      ),
    );
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { candidateId } = params;

  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new ApiError(404, "Candidate not found");
  }

  const election = await Election.findById(candidate.electionId);
  ensureUpcomingElection(election);

  const voteCount = await Vote.countDocuments({ candidateId: candidate._id });

  if (voteCount > 0) {
    throw new ApiError(
      400,
      "Candidate cannot be deleted because votes already exist for this candidate",
    );
  }

  const deletedSnapshot = {
    electionId: candidate.electionId,
    postId: candidate.postId,
    userId: candidate.userId,
    fullName: candidate.fullName,
    partyName: candidate.partyName,
    approvalStatus: candidate.approvalStatus,
  };

  await Candidate.findByIdAndDelete(candidateId);

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "candidate.delete",
    targetType: "Candidate",
    targetId: candidate._id,
    status: "success",
    meta: deletedSnapshot,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Candidate deleted successfully"));
});
