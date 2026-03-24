import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.util.js";
import { CLOUDINARY_FOLDERS } from "../constants/upload.constants.js";

export const uploadCandidatePhotoToCloudinary = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "Candidate photo file is required");
    }

    const oldPublicId = req.body?.oldPublicId?.trim() || "";

    const uploadedFile = await uploadOnCloudinary(req.file.path, {
      folder: CLOUDINARY_FOLDERS.candidatePhotos,
      resourceType: "image",
    });

    if (!uploadedFile?.secure_url || !uploadedFile?.public_id) {
      throw new ApiError(500, "Failed to upload candidate photo");
    }

    if (oldPublicId && oldPublicId !== uploadedFile.public_id) {
      try {
        await deleteFromCloudinary(oldPublicId, { resourceType: "image" });
      } catch (error) {
        // don't fail successful new upload just because old cleanup failed
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          fileUrl: uploadedFile.secure_url,
          publicId: uploadedFile.public_id,
          originalName: req.file.originalname,
          bytes: uploadedFile.bytes,
          format: uploadedFile.format,
          resourceType: uploadedFile.resource_type,
        },
        "Candidate photo uploaded successfully",
      ),
    );
  },
);

export const uploadVoterDocumentToCloudinary = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "Voter document file is required");
    }

    const oldPublicId = req.body?.oldPublicId?.trim() || "";

    const isPdf = req.file.mimetype === "application/pdf";

    const uploadedFile = await uploadOnCloudinary(req.file.path, {
      folder: CLOUDINARY_FOLDERS.voterDocuments,
      resourceType: isPdf ? "raw" : "image",
    });

    if (!uploadedFile?.secure_url || !uploadedFile?.public_id) {
      throw new ApiError(500, "Failed to upload voter document");
    }

    if (oldPublicId && oldPublicId !== uploadedFile.public_id) {
      try {
        await deleteFromCloudinary(oldPublicId, {
          resourceType: isPdf ? "raw" : "image",
        });
      } catch (error) {
        // don't fail successful new upload just because old cleanup failed
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          fileUrl: uploadedFile.secure_url,
          publicId: uploadedFile.public_id,
          originalName: req.file.originalname,
          bytes: uploadedFile.bytes,
          format: uploadedFile.format || null,
          resourceType: uploadedFile.resource_type,
        },
        "Voter document uploaded successfully",
      ),
    );
  },
);
