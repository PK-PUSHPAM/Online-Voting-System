import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getPendingVoters = asyncHandler(async (req, res) => {
  const voters = await User.find({
    role: "voter",
    verificationStatus: "pending",
  }).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: voters.length,
        voters,
      },
      "Pending voters fetched successfully",
    ),
  );
});

export const approveVoter = asyncHandler(async (req, res) => {
  const { userId } = req.params;

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
  const { userId } = req.params;

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
