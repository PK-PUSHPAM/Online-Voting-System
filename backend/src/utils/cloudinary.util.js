import fs from "fs/promises";
import { getCloudinary } from "../config/cloudinary.js";
import ApiError from "./ApiError.js";

const removeLocalFile = async (localFilePath) => {
  if (!localFilePath) return;

  try {
    await fs.unlink(localFilePath);
  } catch (error) {
    // local cleanup failure should not break main request flow
  }
};

export const uploadOnCloudinary = async (
  localFilePath,
  {
    folder,
    resourceType = "image",
    publicIdPrefix = "",
    useOriginalFilename = true,
  } = {},
) => {
  if (!localFilePath) {
    throw new ApiError(400, "Local file path is required for upload");
  }

  try {
    const cloudinary = getCloudinary();
    const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: resourceType,
      use_filename: useOriginalFilename,
      unique_filename: true,
      overwrite: false,
      ...(publicIdPrefix ? { public_id: publicIdPrefix } : {}),
    });

    return uploadResponse;
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Failed to upload file to Cloudinary",
    );
  } finally {
    await removeLocalFile(localFilePath);
  }
};

export const deleteFromCloudinary = async (
  publicId,
  { resourceType = "image" } = {},
) => {
  if (!publicId) return null;

  try {
    const cloudinary = getCloudinary();
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    return response;
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Failed to delete file from Cloudinary",
    );
  }
};
