import fs from "fs";
import User from "../models/User.js";
import Vote from "../models/Vote.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.util.js";
import {
  createSystemNotification,
  createSystemNotificationsForRoles,
} from "../services/systemNotification.service.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

const PROFILE_PHOTO_FOLDER = "online-voting-system/profile-photos";

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

const cleanupLocalFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Failed to cleanup local file: ${error.message}`);
  }
};

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

export const getAllVoters = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip, sort } = buildPagination(query);
  const {
    search,
    verificationStatus,
    isActive,
    isEligibleToVote,
    mobileVerified,
    ageVerified,
  } = query;

  const filter = { role: "voter" };

  if (verificationStatus) {
    filter.verificationStatus = verificationStatus;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (isEligibleToVote !== undefined) {
    filter.isEligibleToVote = isEligibleToVote === "true";
  }

  if (mobileVerified !== undefined) {
    filter.mobileVerified = mobileVerified === "true";
  }

  if (ageVerified !== undefined) {
    filter.ageVerified = ageVerified === "true";
  }

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
      .populate("verifiedBy", "fullName email role")
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
        "Voters fetched successfully",
      ),
    );
});

export const getVoterById = asyncHandler(async (req, res) => {
  const { params } = req.validatedData || { params: req.params };
  const { userId } = params;

  const voter = await User.findOne({
    _id: userId,
    role: "voter",
  })
    .select("-password -refreshToken")
    .populate("verifiedBy", "fullName email role");

  if (!voter) {
    throw new ApiError(404, "Voter not found");
  }

  const [totalVotesCast, latestVote] = await Promise.all([
    Vote.countDocuments({ voterId: voter._id }),
    Vote.findOne({ voterId: voter._id })
      .sort({ createdAt: -1 })
      .populate("electionId", "title status")
      .populate("postId", "title")
      .populate("candidateId", "fullName partyName"),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        voter,
        votingSummary: {
          totalVotesCast,
          hasVoted: totalVotesCast > 0,
          latestVote,
        },
      },
      "Voter fetched successfully",
    ),
  );
});

export const approveVoter = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };
  const { userId } = params;
  const notes = body?.notes?.trim() || "";

  const voter = await User.findById(userId);

  if (!voter) {
    throw new ApiError(404, "Voter not found");
  }

  if (voter.role !== "voter") {
    throw new ApiError(400, "This user is not a voter");
  }

  if (!voter.isActive) {
    throw new ApiError(400, "Inactive voter cannot be approved");
  }

  if (!voter.mobileVerified) {
    throw new ApiError(400, "Unverified mobile voter cannot be approved");
  }

  if (!voter.ageVerified) {
    throw new ApiError(400, "Underage voter cannot be approved");
  }

  if (voter.verificationStatus === "approved") {
    throw new ApiError(400, "Voter already approved");
  }

  voter.verificationStatus = "approved";
  voter.isEligibleToVote = true;
  voter.verificationRejectionReason = "";
  voter.verificationNotes = notes;
  voter.verifiedBy = req.user._id;
  voter.verifiedAt = new Date();

  await voter.save({ validateBeforeSave: false });

  const updatedVoter = await User.findById(voter._id)
    .select("-password -refreshToken")
    .populate("verifiedBy", "fullName email role");

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "user.approve_voter",
    targetType: "User",
    targetId: updatedVoter._id,
    status: "success",
    meta: {
      verificationStatus: updatedVoter.verificationStatus,
      isEligibleToVote: updatedVoter.isEligibleToVote,
      notes,
    },
  });

  await createSystemNotification({
    recipientId: updatedVoter._id,
    title: "Voter profile approved",
    message:
      "Your voter profile has been approved. You can vote in active elections.",
    type: "success",
    link: "/voter/profile",
    createdBy: req.user._id,
    source: "profile",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVoter, "Voter approved successfully"));
});

export const rejectVoter = asyncHandler(async (req, res) => {
  const { params, body } = req.validatedData || {
    params: req.params,
    body: req.body,
  };
  const { userId } = params;
  const rejectionReason = body?.reason?.trim() || "";
  const notes = body?.notes?.trim() || "";

  if (!rejectionReason) {
    throw new ApiError(400, "Rejection reason is required");
  }

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

  if (voter.verificationStatus === "approved") {
    const votesCount = await Vote.countDocuments({ voterId: voter._id });

    if (votesCount > 0) {
      throw new ApiError(
        400,
        "Approved voter cannot be rejected after casting vote(s)",
      );
    }
  }

  voter.verificationStatus = "rejected";
  voter.isEligibleToVote = false;
  voter.verificationRejectionReason = rejectionReason;
  voter.verificationNotes = notes;
  voter.verifiedBy = req.user._id;
  voter.verifiedAt = new Date();

  await voter.save({ validateBeforeSave: false });

  const updatedVoter = await User.findById(voter._id)
    .select("-password -refreshToken")
    .populate("verifiedBy", "fullName email role");

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "user.reject_voter",
    targetType: "User",
    targetId: updatedVoter._id,
    status: "success",
    meta: {
      verificationStatus: updatedVoter.verificationStatus,
      isEligibleToVote: updatedVoter.isEligibleToVote,
      rejectionReason,
      notes,
    },
  });

  await createSystemNotification({
    recipientId: updatedVoter._id,
    title: "Voter profile rejected",
    message:
      rejectionReason ||
      "Your voter verification was rejected. Please check your profile.",
    type: "danger",
    link: "/voter/profile",
    createdBy: req.user._id,
    source: "profile",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVoter, "Voter rejected successfully"));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "voter") {
    throw new ApiError(403, "Only voters can update voter profile");
  }

  const identityChanged =
    body.identityType !== undefined || body.identityLast4 !== undefined;

  if (body.fullName !== undefined) {
    user.fullName = body.fullName.trim();
  }

  if (body.identityType !== undefined) {
    user.identityType = body.identityType;
  }

  if (body.identityLast4 !== undefined) {
    user.identityLast4 = body.identityLast4.trim();
  }

  if (identityChanged) {
    user.verificationStatus = "pending";
    user.isEligibleToVote = false;
    user.verifiedBy = null;
    user.verifiedAt = null;
    user.verificationRejectionReason = "";
    user.verificationNotes =
      "Voter updated identity information. Admin re-approval required.";
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "user.update_my_profile",
    targetType: "User",
    targetId: user._id,
    status: "success",
    meta: {
      identityChanged,
      updatedFields: Object.keys(body),
    },
  });

  if (identityChanged) {
    await createSystemNotificationsForRoles({
      roles: ["admin", "super_admin"],
      title: "Voter identity changed",
      message: `${updatedUser.fullName || "A voter"} updated identity information and now requires re-approval.`,
      type: "warning",
      link: "/admin/voters",
      createdBy: req.user._id,
      source: "profile",
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: updatedUser,
        identityChanged,
      },
      identityChanged
        ? "Profile updated successfully. Identity changes require admin re-approval."
        : "Profile updated successfully",
    ),
  );
});

export const uploadMyProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Profile photo is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    cleanupLocalFile(req.file.path);
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "voter") {
    cleanupLocalFile(req.file.path);
    throw new ApiError(403, "Only voters can upload voter profile photo");
  }

  const uploadedImage = await uploadOnCloudinary(req.file.path, {
    folder: PROFILE_PHOTO_FOLDER,
    resourceType: "image",
  });

  cleanupLocalFile(req.file.path);

  if (!uploadedImage?.secure_url || !uploadedImage?.public_id) {
    throw new ApiError(500, "Failed to upload profile photo");
  }

  const oldProfilePhotoPublicId = user.profilePhotoPublicId;

  user.profilePhotoUrl = uploadedImage.secure_url;
  user.profilePhotoPublicId = uploadedImage.public_id;

  await user.save({ validateBeforeSave: false });

  if (
    oldProfilePhotoPublicId &&
    oldProfilePhotoPublicId !== uploadedImage.public_id
  ) {
    try {
      await deleteFromCloudinary(oldProfilePhotoPublicId, {
        resourceType: "image",
      });
    } catch (error) {
      console.warn(`Failed to delete old profile photo: ${error.message}`);
    }
  }

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "user.upload_my_profile_photo",
    targetType: "User",
    targetId: user._id,
    status: "success",
    meta: {
      profilePhotoPublicId: user.profilePhotoPublicId,
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: updatedUser,
        profilePhotoUrl: user.profilePhotoUrl,
      },
      "Profile photo uploaded successfully",
    ),
  );
});
