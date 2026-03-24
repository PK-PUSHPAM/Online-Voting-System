import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    throw new ApiError(401, "Unauthorized request. Access token missing.");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken",
  );

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
