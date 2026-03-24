import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

export const getPendingVoters = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip, sort } = buildPagination(query);
  const { search } = query;

  const filter = {
    role: "voter",
    verificationStatus: "pending",
  };

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobileNumber: { $regex: search, $options: "i" } },
      { internalVoterId: { $regex: search, $options: "i" } },
    ];
  }

  const [totalItems, voters] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select("-password -refreshToken")
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
        { items: voters, pagination },
        "Pending voters fetched successfully",
      ),
    );
});

export const approveVoter = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { userId } = params;

  const voter = await User.findById(userId);

  if (!voter) {
    throw new ApiError(404, "Voter not found");
  }

  if (voter.role !== "voter") {
    throw new ApiError(400, "This user is not a voter");
  }

  if (voter.verificationStatus === "approved") {
    throw new ApiError(400, "Voter already approved");
  }

  voter.verificationStatus = "approved";
  voter.isEligibleToVote = voter.ageVerified;
  voter.verifiedBy = req.user._id;
  voter.verifiedAt = new Date();

  await voter.save();

  const updatedVoter = await User.findById(voter._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVoter, "Voter approved successfully"));
});

export const rejectVoter = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { userId } = params;

  const voter = await User.findById(userId);

  if (!voter) {
    throw new ApiError(404, "Voter not found");
  }

  if (voter.role !== "voter") {
    throw new ApiError(400, "This user is not a voter");
  }

  if (voter.verificationStatus === "rejected") {
    throw new ApiError(400, "Voter already rejected");
  }

  voter.verificationStatus = "rejected";
  voter.isEligibleToVote = false;
  voter.verifiedBy = req.user._id;
  voter.verifiedAt = new Date();

  await voter.save();

  const updatedVoter = await User.findById(voter._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVoter, "Voter rejected successfully"));
});
