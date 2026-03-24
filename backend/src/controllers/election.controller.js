import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import syncElectionStatus from "../utils/syncElectionStatus.js";
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

export const createElection = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };
  const {
    title,
    description,
    startDate,
    endDate,
    isPublished,
    allowedVoterType,
  } = body;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  if (start >= end) {
    throw new ApiError(400, "End date must be greater than start date");
  }

  if (start <= now) {
    throw new ApiError(400, "Election startDate must be in the future");
  }

  const existingElection = await Election.findOne({
    title: title.trim(),
  }).select("_id");

  if (existingElection) {
    throw new ApiError(409, "Election with this title already exists");
  }

  const election = await Election.create({
    title: title.trim(),
    description: description?.trim() || "",
    startDate: start,
    endDate: end,
    status: "upcoming",
    createdBy: req.user._id,
    isPublished: isPublished ?? false,
    allowedVoterType: allowedVoterType || "verifiedOnly",
  });

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "election.create",
    targetType: "Election",
    targetId: election._id,
    status: "success",
    meta: {
      title: election.title,
      startDate: election.startDate,
      endDate: election.endDate,
      isPublished: election.isPublished,
      allowedVoterType: election.allowedVoterType,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, election, "Election created successfully"));
});

export const getAllElections = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip, sort } = buildPagination(query);
  const { status, search } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [totalItems, elections] = await Promise.all([
    Election.countDocuments(filter),
    Election.find(filter).sort(sort).skip(skip).limit(limit),
  ]);

  const syncedItems = await Promise.all(
    elections.map(async (election) => syncElectionStatus(election)),
  );

  const pagination = buildPaginationResponse({
    totalItems,
    page,
    limit,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: syncedItems,
        pagination,
      },
      "Elections fetched successfully",
    ),
  );
});

export const getElectionById = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { electionId } = params;

  let election = await Election.findById(electionId).populate(
    "createdBy",
    "fullName email role",
  );

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  election = await syncElectionStatus(election);

  return res
    .status(200)
    .json(new ApiResponse(200, election, "Election fetched successfully"));
});

export const updateElection = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };

  const { electionId } = params;
  const {
    title,
    description,
    startDate,
    endDate,
    isPublished,
    allowedVoterType,
  } = body;

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const oldState = {
    title: election.title,
    description: election.description,
    startDate: election.startDate,
    endDate: election.endDate,
    isPublished: election.isPublished,
    allowedVoterType: election.allowedVoterType,
    status: election.status,
  };

  const currentStatus = getElectionStatus(election.startDate, election.endDate);

  if (election.status !== currentStatus) {
    election.status = currentStatus;
  }

  const updatedStartDate = startDate ? new Date(startDate) : election.startDate;
  const updatedEndDate = endDate ? new Date(endDate) : election.endDate;

  if (
    Number.isNaN(updatedStartDate.getTime()) ||
    Number.isNaN(updatedEndDate.getTime())
  ) {
    throw new ApiError(400, "Invalid date format");
  }

  if (updatedStartDate >= updatedEndDate) {
    throw new ApiError(400, "End date must be greater than start date");
  }

  if (election.status !== "upcoming") {
    if (title || startDate || endDate || allowedVoterType) {
      throw new ApiError(
        400,
        "Only upcoming elections can modify title, schedule, or voter type",
      );
    }
  }

  if (title && title.trim() !== election.title) {
    const titleExists = await Election.findOne({
      title: title.trim(),
      _id: { $ne: electionId },
    }).select("_id");

    if (titleExists) {
      throw new ApiError(
        409,
        "Another election with this title already exists",
      );
    }
  }

  if (
    election.status === "upcoming" &&
    startDate &&
    updatedStartDate <= new Date()
  ) {
    throw new ApiError(400, "Updated startDate must be in the future");
  }

  election.title = title?.trim() || election.title;
  election.description = description?.trim() ?? election.description;
  election.startDate = updatedStartDate;
  election.endDate = updatedEndDate;

  if (typeof isPublished === "boolean") {
    election.isPublished = isPublished;
  }

  if (allowedVoterType && election.status === "upcoming") {
    election.allowedVoterType = allowedVoterType;
  }

  await election.save();

  const syncedElection = await syncElectionStatus(election);

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "election.update",
    targetType: "Election",
    targetId: syncedElection._id,
    status: "success",
    meta: {
      before: oldState,
      after: {
        title: syncedElection.title,
        description: syncedElection.description,
        startDate: syncedElection.startDate,
        endDate: syncedElection.endDate,
        isPublished: syncedElection.isPublished,
        allowedVoterType: syncedElection.allowedVoterType,
        status: syncedElection.status,
      },
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, syncedElection, "Election updated successfully"),
    );
});

export const deleteElection = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { electionId } = params;

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const currentStatus = getElectionStatus(election.startDate, election.endDate);

  if (currentStatus !== "upcoming") {
    throw new ApiError(400, "Only upcoming elections can be deleted");
  }

  const [postCount, candidateCount, voteCount] = await Promise.all([
    Post.countDocuments({ electionId }),
    Candidate.countDocuments({ electionId }),
    Vote.countDocuments({ electionId }),
  ]);

  if (postCount > 0 || candidateCount > 0 || voteCount > 0) {
    throw new ApiError(
      400,
      "Election cannot be deleted because related posts, candidates, or votes already exist",
    );
  }

  const deletedSnapshot = {
    title: election.title,
    startDate: election.startDate,
    endDate: election.endDate,
    isPublished: election.isPublished,
    allowedVoterType: election.allowedVoterType,
    status: election.status,
  };

  await Election.findByIdAndDelete(electionId);

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "election.delete",
    targetType: "Election",
    targetId: election._id,
    status: "success",
    meta: deletedSnapshot,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Election deleted successfully"));
});

export const getActivePublishedElectionsForVoter = asyncHandler(
  async (req, res) => {
    const voter = req.user;

    const elections = await Election.find({
      isPublished: true,
    })
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 });

    const syncedElections = await Promise.all(
      elections.map(async (election) => syncElectionStatus(election)),
    );

    const activeElections = syncedElections.filter((election) => {
      if (election.status !== "active") return false;

      if (
        election.allowedVoterType === "verifiedOnly" &&
        voter.verificationStatus !== "approved"
      ) {
        return false;
      }

      return true;
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: activeElections.length,
          elections: activeElections,
        },
        "Active elections fetched successfully",
      ),
    );
  },
);
