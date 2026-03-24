import Election from "../models/Election.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import syncElectionStatus from "../utils/syncElectionStatus.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

export const createElection = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    startDate,
    endDate,
    isPublished,
    allowedVoterType,
  } = req.body;

  if (!title || !startDate || !endDate) {
    throw new ApiError(400, "Title, startDate and endDate are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  if (start >= end) {
    throw new ApiError(400, "End date must be greater than start date");
  }

  const existingElection = await Election.findOne({
    title: title.trim(),
  });

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

  return res
    .status(201)
    .json(new ApiResponse(201, election, "Election created successfully"));
});

export const getAllElections = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = buildPagination(req.query);

  const { status, search } = req.query;

  const filter = {};

  // 🔹 Status filter
  if (status) {
    filter.status = status;
  }

  // 🔹 Search filter (title / description)
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

  const pagination = buildPaginationResponse({
    totalItems,
    page,
    limit,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: elections,
        pagination,
      },
      "Elections fetched successfully",
    ),
  );
});

export const getElectionById = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const election = await Election.findById(electionId).populate(
    "createdBy",
    "fullName email role",
  );

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, election, "Election fetched successfully"));
});

export const updateElection = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const {
    title,
    description,
    startDate,
    endDate,
    isPublished,
    allowedVoterType,
  } = req.body;

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  const updatedStartDate = startDate ? new Date(startDate) : election.startDate;
  const updatedEndDate = endDate ? new Date(endDate) : election.endDate;

  if (isNaN(updatedStartDate.getTime()) || isNaN(updatedEndDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  if (updatedStartDate >= updatedEndDate) {
    throw new ApiError(400, "End date must be greater than start date");
  }

  if (title && title.trim() !== election.title) {
    const titleExists = await Election.findOne({
      title: title.trim(),
      _id: { $ne: electionId },
    });

    if (titleExists) {
      throw new ApiError(
        409,
        "Another election with this title already exists",
      );
    }
  }

  election.title = title?.trim() || election.title;
  election.description = description?.trim() ?? election.description;
  election.startDate = updatedStartDate;
  election.endDate = updatedEndDate;
  election.isPublished =
    typeof isPublished === "boolean" ? isPublished : election.isPublished;
  election.allowedVoterType = allowedVoterType || election.allowedVoterType;

  await election.save();

  return res
    .status(200)
    .json(new ApiResponse(200, election, "Election updated successfully"));
});

export const deleteElection = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const election = await Election.findById(electionId);

  if (!election) {
    throw new ApiError(404, "Election not found");
  }

  await Election.findByIdAndDelete(electionId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Election deleted successfully"));
});

export const getActivePublishedElectionsForVoter = asyncHandler(
  async (req, res) => {
    const elections = await Election.find({
      isPublished: true,
    })
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 });

    const syncedElections = await Promise.all(
      elections.map(async (election) => await syncElectionStatus(election)),
    );

    const activeElections = syncedElections.filter(
      (election) => election.status === "active",
    );

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
