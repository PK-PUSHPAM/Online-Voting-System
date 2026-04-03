import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Election from "../models/Election.js";
import Post from "../models/Post.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeMobileNumber = (mobileNumber = "") => mobileNumber.trim();

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

const generateInternalVoterId = () => {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `OVS-${year}-${randomPart}`;
};

const generateUniqueInternalVoterId = async () => {
  let internalVoterId = generateInternalVoterId();
  let existingUser = await User.findOne({ internalVoterId }).select("_id");

  while (existingUser) {
    internalVoterId = generateInternalVoterId();
    existingUser = await User.findOne({ internalVoterId }).select("_id");
  }

  return internalVoterId;
};

const countActiveSuperAdmins = async () => {
  return User.countDocuments({
    role: "super_admin",
    isActive: true,
  });
};

export const createAdmin = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };
  const fullName = body.fullName.trim();
  const email = normalizeEmail(body.email);
  const mobileNumber = normalizeMobileNumber(body.mobileNumber);
  const password = body.password;
  const dob = body.dob;
  const role = body.role || "admin";

  if (role === "super_admin" && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can create another super admin");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { mobileNumber }],
  }).select("_id");

  if (existingUser) {
    throw new ApiError(
      409,
      "User already exists with this email or mobile number",
    );
  }

  const internalVoterId = await generateUniqueInternalVoterId();

  const adminUser = await User.create({
    fullName,
    email,
    mobileNumber,
    password,
    dob,
    role,
    ageVerified: true,
    mobileVerified: true,
    verificationStatus: "approved",
    isEligibleToVote: false,
    isActive: true,
    internalVoterId,
  });

  const createdAdmin = await User.findById(adminUser._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "admin.create_admin",
    targetType: "User",
    targetId: createdAdmin._id,
    status: "success",
    meta: {
      createdRole: createdAdmin.role,
      email: createdAdmin.email,
      mobileNumber: createdAdmin.mobileNumber,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdAdmin,
        `${createdAdmin.role} created successfully`,
      ),
    );
});

export const updateAdminStatus = asyncHandler(async (req, res) => {
  const { body, params } = req.validatedData || {
    body: req.body,
    params: req.params,
  };

  const { userId } = params;
  const { isActive } = body;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!["admin", "super_admin"].includes(user.role)) {
    throw new ApiError(400, "Target user is not an admin");
  }

  if (String(user._id) === String(req.user._id) && isActive === false) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  if (user.role === "super_admin" && user.isActive && !isActive) {
    const count = await countActiveSuperAdmins();

    if (count <= 1) {
      throw new ApiError(400, "Cannot deactivate the last active super admin");
    }
  }

  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "admin.update_admin_status",
    targetType: "User",
    targetId: updatedUser._id,
    status: "success",
    meta: {
      newIsActive: updatedUser.isActive,
      targetRole: updatedUser.role,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        `Admin ${updatedUser.isActive ? "activated" : "deactivated"} successfully`,
      ),
    );
});

export const changeAdminRole = asyncHandler(async (req, res) => {
  const { body, params } = req.validatedData || {
    body: req.body,
    params: req.params,
  };

  const { userId } = params;
  const { role } = body;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!["admin", "super_admin"].includes(user.role)) {
    throw new ApiError(400, "Target user is not an admin");
  }

  if (role === "super_admin" && req.user.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can assign super admin role");
  }

  if (
    String(user._id) === String(req.user._id) &&
    user.role === "super_admin" &&
    role !== "super_admin"
  ) {
    throw new ApiError(400, "You cannot remove your own super admin role");
  }

  if (user.role === "super_admin" && role !== "super_admin") {
    const count = await countActiveSuperAdmins();

    if (count <= 1) {
      throw new ApiError(400, "Cannot change role of last super admin");
    }
  }

  user.role = role;
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "admin.change_admin_role",
    targetType: "User",
    targetId: updatedUser._id,
    status: "success",
    meta: {
      newRole: updatedUser.role,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, `Role updated to ${role} successfully`),
    );
});

export const getAllAdmins = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip, sort } = buildPagination(query);
  const { search, role, isActive } = query;

  const filter = {
    role: { $in: ["admin", "super_admin"] },
  };

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobileNumber: { $regex: search, $options: "i" } },
      { internalVoterId: { $regex: search, $options: "i" } },
    ];
  }

  const [totalItems, admins] = await Promise.all([
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
        { items: admins, pagination },
        "Admins fetched successfully",
      ),
    );
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { query } = req.validatedData || { query: req.query };
  const { page, limit, skip } = buildPagination({
    ...query,
    sortBy: "createdAt",
    sortOrder: query.sortOrder || "desc",
  });

  const filter = {};

  if (query.action) {
    filter.action = query.action;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.actorRole) {
    filter.actorRole = query.actorRole;
  }

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  if (query.actorId) {
    filter.actorId = new mongoose.Types.ObjectId(query.actorId);
  }

  if (query.targetId) {
    filter.targetId = new mongoose.Types.ObjectId(query.targetId);
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};

    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  if (query.search) {
    filter.$or = [
      { action: { $regex: query.search, $options: "i" } },
      { actorRole: { $regex: query.search, $options: "i" } },
      { targetType: { $regex: query.search, $options: "i" } },
      { ipAddress: { $regex: query.search, $options: "i" } },
      { "meta.email": { $regex: query.search, $options: "i" } },
      { "meta.mobileNumber": { $regex: query.search, $options: "i" } },
      { "meta.reason": { $regex: query.search, $options: "i" } },
      { "meta.rejectionReason": { $regex: query.search, $options: "i" } },
    ];
  }

  const [totalItems, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .populate("actorId", "fullName email mobileNumber role")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
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
        items: logs,
        pagination,
      },
      "Audit logs fetched successfully",
    ),
  );
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalVoters,
    pendingVoters,
    approvedVoters,
    rejectedVoters,
    activeAdmins,
    activeSuperAdmins,
    totalElections,
    upcomingElections,
    activeElections,
    endedElections,
    totalPosts,
    totalCandidates,
    approvedCandidates,
    totalVotes,
    recentAuditCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "voter" }),
    User.countDocuments({ role: "voter", verificationStatus: "pending" }),
    User.countDocuments({ role: "voter", verificationStatus: "approved" }),
    User.countDocuments({ role: "voter", verificationStatus: "rejected" }),
    User.countDocuments({ role: "admin", isActive: true }),
    User.countDocuments({ role: "super_admin", isActive: true }),
    Election.countDocuments(),
    Election.countDocuments({ status: "upcoming" }),
    Election.countDocuments({ status: "active" }),
    Election.countDocuments({ status: "ended" }),
    Post.countDocuments(),
    Candidate.countDocuments(),
    Candidate.countDocuments({ approvalStatus: "approved", isApproved: true }),
    Vote.countDocuments(),
    AuditLog.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const [
    recentAuditLogs,
    topActiveElectionsByVotes,
    voteTrendsData,
    verificationBreakdownData,
  ] = await Promise.all([
    AuditLog.find({})
      .populate("actorId", "fullName email role")
      .sort({ createdAt: -1 })
      .limit(10),
    Vote.aggregate([
      {
        $group: {
          _id: "$electionId",
          totalVotes: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalVotes: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "elections",
          localField: "_id",
          foreignField: "_id",
          as: "election",
        },
      },
      {
        $unwind: "$election",
      },
      {
        $project: {
          _id: 0,
          electionId: "$election._id",
          title: "$election.title",
          status: "$election.status",
          isPublished: "$election.isPublished",
          totalVotes: 1,
        },
      },
    ]),
    Vote.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $limit: 30,
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          votes: "$count",
        },
      },
    ]),
    User.aggregate([
      {
        $match: { role: "voter" },
      },
      {
        $group: {
          _id: "$verificationStatus",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          totalUsers,
          totalVoters,
          pendingVoters,
          approvedVoters,
          rejectedVoters,
          activeAdmins,
          activeSuperAdmins,
          totalElections,
          upcomingElections,
          activeElections,
          endedElections,
          totalPosts,
          totalCandidates,
          approvedCandidates,
          totalVotes,
          recentAuditCount,
          verifiedVoters: approvedVoters,
          totalAdmins: activeAdmins + activeSuperAdmins,
        },
        auditLogs: recentAuditLogs,
        elections: topActiveElectionsByVotes,
        voteTrends: voteTrendsData,
        verificationBreakdown: verificationBreakdownData,
      },
      "Dashboard summary fetched successfully",
    ),
  );
});
