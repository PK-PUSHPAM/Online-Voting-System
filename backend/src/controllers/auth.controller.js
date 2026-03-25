import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import AuditLog from "../models/AuditLog.js";
import generateOtp from "../utils/generateOtp.js";
import generateAccessAndRefreshTokens, {
  hashToken,
} from "../utils/generateTokens.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../constants/cookieOptions.constants.js";
import sendEmail from "../utils/sendEmail.js";

const OTP_EXPIRY_IN_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_IN_MS = 60 * 1000;

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

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeMobileNumber = (mobileNumber = "") => mobileNumber.trim();

const hashOtpCode = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
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

const parseJsonEnv = (value, fallback) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(500, "Invalid JSON configuration in SMS env variables");
  }
};

const replacePlaceholders = (input, payload) => {
  if (typeof input === "string") {
    return input.replace(/{{\s*(\w+)\s*}}/g, (_, key) =>
      payload[key] !== undefined && payload[key] !== null
        ? String(payload[key])
        : "",
    );
  }

  if (Array.isArray(input)) {
    return input.map((item) => replacePlaceholders(item, payload));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        replacePlaceholders(value, payload),
      ]),
    );
  }

  return input;
};

const getValueByPath = (obj, path) => {
  if (!obj || !path) return undefined;

  return path.split(".").reduce((accumulator, key) => {
    if (accumulator === undefined || accumulator === null) return undefined;
    return accumulator[key];
  }, obj);
};

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

const sendOtpToMobile = async ({ mobileNumber, otp, purpose }) => {
  const provider = (process.env.SMS_PROVIDER || "mock").trim().toLowerCase();

  const messageTemplate =
    process.env.OTP_MESSAGE_TEMPLATE ||
    "Your OTP for Online Voting System is {{otp}}. It is valid for 5 minutes.";

  const templatePayload = {
    otp,
    mobileNumber,
    purpose,
    appName: "Online Voting System",
  };

  const message = replacePlaceholders(messageTemplate, templatePayload);

  if (provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(
        500,
        "SMS provider is not configured for production environment",
      );
    }

    console.log(`[MOCK_SMS] OTP for ${mobileNumber}: ${otp}`);
    return { provider: "mock" };
  }

  const smsApiUrl = process.env.SMS_API_URL;

  if (!smsApiUrl) {
    throw new ApiError(500, "SMS_API_URL is missing");
  }

  const method = (process.env.SMS_API_METHOD || "POST").toUpperCase();
  const timeoutMs = Number(process.env.SMS_API_TIMEOUT_MS || 10000);

  const headersTemplate = parseJsonEnv(process.env.SMS_REQUEST_HEADERS_JSON, {
    "Content-Type": "application/json",
  });

  const bodyTemplate = parseJsonEnv(process.env.SMS_REQUEST_BODY_TEMPLATE, {
    mobileNumber: "{{mobileNumber}}",
    message: "{{message}}",
    otp: "{{otp}}",
    purpose: "{{purpose}}",
  });

  const headers = replacePlaceholders(headersTemplate, {
    ...templatePayload,
    message,
  });

  const body = replacePlaceholders(bodyTemplate, {
    ...templatePayload,
    message,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(smsApiUrl, {
      method,
      headers,
      body: method === "GET" ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const rawResponse = await response.text();

    let parsedResponse = null;
    try {
      parsedResponse = rawResponse ? JSON.parse(rawResponse) : null;
      console.log("SMS_PROVIDER:", provider);
      console.log("SMS_API_URL:", smsApiUrl);
      console.log("SMS_HEADERS:", headers);
      console.log("SMS_BODY:", body);
      console.log("SMS_RESPONSE_STATUS:", response.status);
      console.log("SMS_RESPONSE_RAW:", rawResponse);
      console.log("SMS_RESPONSE_PARSED:", parsedResponse);
    } catch {
      parsedResponse = rawResponse;
    }

    if (!response.ok) {
      throw new ApiError(502, "SMS provider rejected the OTP delivery request");
    }

    const successPath = process.env.SMS_SUCCESS_PATH || "";
    const successValue = process.env.SMS_SUCCESS_VALUE;

    if (successPath && successValue !== undefined) {
      const actualValue = getValueByPath(parsedResponse, successPath);

      if (String(actualValue) !== String(successValue)) {
        throw new ApiError(
          502,
          "SMS provider did not confirm OTP delivery success",
        );
      }
    }

    return {
      provider,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(504, "SMS provider timed out while sending OTP");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, error.message || "Failed to send OTP");
  } finally {
    clearTimeout(timeout);
  }
};

const verifyOtpRecord = async ({ mobileNumber, otp, purpose }) => {
  const otpRecord = await Otp.findOne({
    mobileNumber,
    purpose,
    isUsed: false,
  })
    .select("+otp")
    .sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    throw new ApiError(429, "Too many incorrect OTP attempts");
  }

  const hashedIncomingOtp = hashOtpCode(otp);

  if (hashedIncomingOtp !== otpRecord.otp) {
    otpRecord.attempts += 1;
    await otpRecord.save({ validateBeforeSave: false });
    throw new ApiError(400, "Invalid OTP");
  }

  otpRecord.isUsed = true;
  await otpRecord.save({ validateBeforeSave: false });

  return otpRecord;
};

export const sendOtp = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };
  const purpose = body.purpose || "register";
  const mobileNumber = normalizeMobileNumber(body.mobileNumber);

  const existingUser = await User.findOne({ mobileNumber }).select(
    "_id role isActive mobileVerified verificationStatus",
  );

  if (purpose === "register" && existingUser) {
    throw new ApiError(409, "User already exists with this mobile number");
  }

  if ((purpose === "login" || purpose === "reset-password") && !existingUser) {
    throw new ApiError(404, "User not found with this mobile number");
  }

  if (
    (purpose === "login" || purpose === "reset-password") &&
    existingUser &&
    !existingUser.isActive
  ) {
    throw new ApiError(403, "Your account is inactive");
  }

  const latestOtp = await Otp.findOne({
    mobileNumber,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (
    latestOtp &&
    Date.now() - new Date(latestOtp.createdAt).getTime() <
      OTP_RESEND_COOLDOWN_IN_MS
  ) {
    throw new ApiError(
      429,
      "Please wait at least 60 seconds before requesting another OTP",
    );
  }

  await Otp.deleteMany({
    mobileNumber,
    purpose,
    isUsed: false,
  });

  const otp = generateOtp();

  // Send OTP via email
  const emailMessage = `Your OTP is ${otp}. It is valid for 5 minutes.`;
  const emailRecipient = existingUser?.email || req.body.email;

  console.log("Attempting to send OTP email to:", emailRecipient);

  try {
    if (!emailRecipient) {
      throw new Error("Email recipient not found");
    }

    await sendEmail({
      to: emailRecipient,
      subject: "OTP Verification",
      text: emailMessage,
    });

    console.log("OTP email sent successfully to:", emailRecipient);
  } catch (error) {
    console.error("Failed to send OTP email:", {
      recipient: emailRecipient,
      error: error.message,
      fullError: error,
    });
    // Continue with SMS OTP even if email fails
  }

  const hashedOtp = hashOtpCode(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_IN_MS);

  const otpRecord = await Otp.create({
    mobileNumber,
    otp: hashedOtp,
    purpose,
    expiresAt,
  });

  try {
    const delivery = await sendOtpToMobile({
      mobileNumber,
      otp,
      purpose,
    });

    await createAuditLog({
      req,
      actorId: existingUser?._id || null,
      actorRole: existingUser?.role || "unknown",
      action: "auth.send_otp",
      targetType: "User",
      targetId: existingUser?._id || null,
      status: "success",
      meta: {
        mobileNumber,
        purpose,
        deliveryMode: delivery.provider,
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          mobileNumber,
          purpose,
          expiresAt,
          deliveryMode: delivery.provider,
        },
        "OTP sent successfully",
      ),
    );
  } catch (error) {
    await Otp.deleteOne({ _id: otpRecord._id });

    await createAuditLog({
      req,
      actorId: existingUser?._id || null,
      actorRole: existingUser?.role || "unknown",
      action: "auth.send_otp",
      targetType: "User",
      targetId: existingUser?._id || null,
      status: "failure",
      meta: {
        mobileNumber,
        purpose,
        reason: error.message,
      },
    });

    throw error;
  }
});

export const verifyOtpAndRegister = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };

  const fullName = body.fullName.trim();
  const email = normalizeEmail(body.email);
  const mobileNumber = normalizeMobileNumber(body.mobileNumber);
  const password = body.password;
  const dob = body.dob;
  const otp = body.otp.trim();
  const identityType = body.identityType || "other";
  const identityLast4 = body.identityLast4 || "";
  const documentUrl = body.documentUrl || "";
  const documentPublicId = body.documentPublicId || "";

  const existingUser = await User.findOne({
    $or: [{ email }, { mobileNumber }],
  }).select("_id");

  if (existingUser) {
    throw new ApiError(
      409,
      "User already exists with this email or mobile number",
    );
  }

  await verifyOtpRecord({
    mobileNumber,
    otp,
    purpose: "register",
  });

  const age = calculateAge(dob);
  const isAdult = age >= 18;
  const internalVoterId = await generateUniqueInternalVoterId();

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
    identityType,
    identityLast4,
    documentUrl,
    documentPublicId,
    role: "voter",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: "auth.register",
    targetType: "User",
    targetId: user._id,
    status: "success",
    meta: {
      mobileNumber: user.mobileNumber,
      email: user.email,
      verificationStatus: user.verificationStatus,
    },
  });

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
  const { body } = req.validatedData || { body: req.body };
  const emailOrMobile = body.emailOrMobile.trim();
  const password = body.password;

  const query = emailOrMobile.includes("@")
    ? { email: normalizeEmail(emailOrMobile) }
    : { mobileNumber: normalizeMobileNumber(emailOrMobile) };

  const user = await User.findOne(query).select("+refreshToken");

  if (!user) {
    await createAuditLog({
      req,
      action: "auth.login_password",
      status: "failure",
      meta: {
        identifier: emailOrMobile,
        reason: "user_not_found",
      },
    });

    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    await createAuditLog({
      req,
      actorId: user._id,
      actorRole: user.role,
      action: "auth.login_password",
      targetType: "User",
      targetId: user._id,
      status: "failure",
      meta: {
        reason: "inactive_account",
      },
    });

    throw new ApiError(403, "Your account is inactive");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    await createAuditLog({
      req,
      actorId: user._id,
      actorRole: user.role,
      action: "auth.login_password",
      targetType: "User",
      targetId: user._id,
      status: "failure",
      meta: {
        reason: "invalid_password",
      },
    });

    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: "auth.login_password",
    targetType: "User",
    targetId: user._id,
    status: "success",
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
        },
        "Login successful",
      ),
    );
});

export const loginWithOtp = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };
  const mobileNumber = normalizeMobileNumber(body.mobileNumber);
  const otp = body.otp.trim();

  const user = await User.findOne({ mobileNumber }).select("+refreshToken");

  if (!user) {
    await createAuditLog({
      req,
      action: "auth.login_otp",
      status: "failure",
      meta: {
        mobileNumber,
        reason: "user_not_found",
      },
    });

    throw new ApiError(404, "User not found with this mobile number");
  }

  if (!user.isActive) {
    await createAuditLog({
      req,
      actorId: user._id,
      actorRole: user.role,
      action: "auth.login_otp",
      targetType: "User",
      targetId: user._id,
      status: "failure",
      meta: {
        reason: "inactive_account",
      },
    });

    throw new ApiError(403, "Your account is inactive");
  }

  await verifyOtpRecord({
    mobileNumber,
    otp,
    purpose: "login",
  });

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  await createAuditLog({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: "auth.login_otp",
    targetType: "User",
    targetId: user._id,
    status: "success",
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
        },
        "OTP login successful",
      ),
    );
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { body } = req.validatedData || { body: req.body };
  const mobileNumber = normalizeMobileNumber(body.mobileNumber);
  const otp = body.otp.trim();
  const newPassword = body.newPassword;

  const user = await User.findOne({ mobileNumber }).select("+refreshToken");

  if (!user) {
    await createAuditLog({
      req,
      action: "auth.reset_password",
      status: "failure",
      meta: {
        mobileNumber,
        reason: "user_not_found",
      },
    });

    throw new ApiError(404, "User not found with this mobile number");
  }

  if (!user.isActive) {
    await createAuditLog({
      req,
      actorId: user._id,
      actorRole: user.role,
      action: "auth.reset_password",
      targetType: "User",
      targetId: user._id,
      status: "failure",
      meta: {
        reason: "inactive_account",
      },
    });

    throw new ApiError(403, "Your account is inactive");
  }

  await verifyOtpRecord({
    mobileNumber,
    otp,
    purpose: "reset-password",
  });

  user.password = newPassword;
  user.refreshToken = "";
  await user.save();

  await createAuditLog({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: "auth.reset_password",
    targetType: "User",
    targetId: user._id,
    status: "success",
  });

  return res
    .status(200)
    .clearCookie("accessToken", accessTokenCookieOptions)
    .clearCookie("refreshToken", refreshTokenCookieOptions)
    .json(new ApiResponse(200, null, "Password reset successfully"));
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

  const user = await User.findById(decodedToken?._id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const hashedIncomingRefreshToken = hashToken(incomingRefreshToken);

  if (hashedIncomingRefreshToken !== user.refreshToken) {
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
        {
          accessToken,
        },
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

  await createAuditLog({
    req,
    actorId: req.user._id,
    actorRole: req.user.role || "unknown",
    action: "auth.logout",
    targetType: "User",
    targetId: req.user._id,
    status: "success",
  });

  return res
    .status(200)
    .clearCookie("accessToken", accessTokenCookieOptions)
    .clearCookie("refreshToken", refreshTokenCookieOptions)
    .json(new ApiResponse(200, null, "Logout successful"));
});
