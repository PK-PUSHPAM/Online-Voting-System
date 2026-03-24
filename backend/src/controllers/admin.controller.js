import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { buildPagination } from "../utils/pagination.util.js";
import { buildPaginationResponse } from "../utils/paginationResponse.util.js";

const countActiveSuperAdmins = async () => {
  return await User.countDocuments({
    role: "super_admin",
    isActive: true,
  });
};

export const createAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, mobileNumber, password, dob, role } = req.body;

  if (!fullName || !email || !mobileNumber || !password || !dob) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const allowedRoles = ["admin", "super_admin"];

  if (role && !allowedRoles.includes(role)) {
    throw new ApiError(400, "Invalid role for admin creation");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { mobileNumber }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "User already exists with this email or mobile number",
    );
  }

  const adminUser = await User.create({
    fullName,
    email,
    mobileNumber,
    password,
    dob,
    role: role || "admin",
    ageVerified: true,
    mobileVerified: true,
    verificationStatus: "approved",
    isEligibleToVote: false,
    isActive: true,
  });

  const createdAdmin = await User.findById(adminUser._id).select(
    "-password -refreshToken",
  );

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
  const { userId } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!["admin", "super_admin"].includes(user.role)) {
    throw new ApiError(400, "Target user is not an admin");
  }

  if (user.role === "super_admin" && user.isActive && !isActive) {
    const count = await countActiveSuperAdmins();

    if (count <= 1) {
      throw new ApiError(400, "Cannot deactivate the last active super admin");
    }
  }

  user.isActive = Boolean(isActive);
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

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
  const { userId } = req.params;
  const { role } = req.body;

  if (!["admin", "super_admin"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!["admin", "super_admin"].includes(user.role)) {
    throw new ApiError(400, "Target user is not an admin");
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

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, `Role updated to ${role} successfully`),
    );
});

export const getAllAdmins = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = buildPagination(req.query);
  const { search, role, isActive } = req.query;

  // 🔥 FIX: Only admins allowed
  const filter = {
    role: { $in: ["admin", "super_admin"] },
  };

  // optional filters
  if (role) {
    filter.role = role; // override if specific role needed
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
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
