import User from "../models/User.js";
import Otp from "../models/Otp.js";
import generateOtp from "../utils/generateOtp.js";
import generateAccessAndRefreshTokens from "../utils/generateTokens.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: false, // production me true karna hai (HTTPS)
  sameSite: "lax",
};

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

export const sendOtp = async (req, res) => {
  try {
    const { mobileNumber, purpose = "register" } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
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

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        mobileNumber,
        purpose,
        otp: otpDoc.otp, // production me response se hata dena
        expiresAt: otpDoc.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const verifyOtpAndRegister = async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or mobile number",
      });
    }

    const otpRecord = await Otp.findOne({
      mobileNumber,
      otp,
      purpose: "register",
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
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

    return res.status(201).json({
      success: true,
      message: isAdult
        ? "Registration successful. Waiting for admin verification."
        : "Registration successful, but user is under 18 and not eligible to vote.",
      data: {
        user: createdUser,
        isAdult,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.stack,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/mobile and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobileNumber: emailOrMobile }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "Login successful",
        data: {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
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
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({
        success: true,
        message: "Logout successful",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is expired or already used",
      });
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user);

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "Access token refreshed successfully",
        data: {
          accessToken,
          refreshToken,
        },
      });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      error: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: req.user,
  });
};
