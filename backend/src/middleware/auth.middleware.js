import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const extractAccessToken = (req) => {
  const authHeader = req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = extractAccessToken(req);

  if (!token) {
    throw new ApiError(401, "Unauthorized request. Access token missing.");
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new ApiError(500, "ACCESS_TOKEN_SECRET is not configured");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decodedToken?._id)
    .select("-password -refreshToken")
    .lean();

  if (!user) {
    throw new ApiError(401, "Invalid access token. User not found.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account is inactive.");
  }

  req.user = user;
  next();
});

export default verifyJWT;
