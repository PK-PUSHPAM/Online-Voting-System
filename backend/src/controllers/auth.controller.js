import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import generateOtp from "../utils/generateOtp.js";
import generateAccessAndRefreshTokens from "../utils/generateTokens.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../constants/cookieOptions.constants.js";

const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const generateInternalVoterId = () => {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OVS-${year}-${randomPart}`;
};

export const sendOtp = asyncHandler(async (req, res) => {
  const { mobileNumber, purpose = "register" } = req.body;

  if (!mobileNumber) {
    throw new ApiError(400, "Mobile number is required");
  }

  if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
    throw new ApiError(400, "Invalid mobile number");
  }

  await Otp.deleteMany({
    mobileNumber,
    purpose,
    isUsed: false,
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const otpDoc = await Otp.create({
    mobileNumber,
    otp,
    purpose,
    expiresAt,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        mobileNumber,
        purpose,
        otp: otpDoc.otp,
        expiresAt: otpDoc.expiresAt,
      },
      "OTP sent successfully",
    ),
  );
});

export const verifyOtpAndRegister = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    mobileNumber,
    password,
    dob,
    otp,
    identityType,
    identityLast4,
    documentUrl,
    documentPublicId,
  } = req.body;

  if (!fullName || !email || !mobileNumber || !password || !dob || !otp) {
    throw new ApiError(400, "All required fields must be provided");
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

  const otpRecord = await Otp.findOne({
    mobileNumber,
    otp,
    purpose: "register",
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  const age = calculateAge(dob);
  const isAdult = age >= 18;

  const internalVoterId = generateInternalVoterId();

  const user = await User.create({
    fullName,
    email,
    mobileNumber,
    password,
    dob,
    mobileVerified: true,
    ageVerified: isAdult,
    isEligibleToVote: false,
    verificationStatus: "pending",
    internalVoterId,
    identityType: identityType || "other",
    identityLast4: identityLast4 || "",
    documentUrl: documentUrl || "",
    documentPublicId: documentPublicId || "",
    role: "voter",
  });

  otpRecord.isUsed = true;
  await otpRecord.save();

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: createdUser,
        isAdult,
      },
      isAdult
        ? "Registration successful. Waiting for admin verification."
        : "Registration successful, but user is under 18 and not eligible to vote.",
    ),
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { emailOrMobile, password } = req.body;

  if (!emailOrMobile || !password) {
    throw new ApiError(400, "Email/mobile and password are required");
  }

  const user = await User.findOne({
    $or: [{ email: emailOrMobile }, { mobileNumber: emailOrMobile }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account is inactive");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful",
      ),
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or already used");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed successfully",
      ),
    );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true },
  );

  return res
    .status(200)
    .clearCookie("accessToken", accessTokenCookieOptions)
    .clearCookie("refreshToken", refreshTokenCookieOptions)
    .json(new ApiResponse(200, null, "Logout successful"));
});
