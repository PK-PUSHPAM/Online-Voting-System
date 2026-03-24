import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.util.js";
import { CLOUDINARY_FOLDERS } from "../constants/upload.constants.js";

const sanitizePublicId = (value = "") => value.trim();

const validateOldPublicIdBelongsToFolder = (publicId, folder) => {
  if (!publicId) return;

  if (!publicId.startsWith(`${folder}/`)) {
    throw new ApiError(
      400,
      "Invalid oldPublicId for the requested upload type",
    );
  }
};

export const uploadCandidatePhotoToCloudinary = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "Candidate photo file is required");
    }

    const oldPublicId = sanitizePublicId(req.body?.oldPublicId);
    validateOldPublicIdBelongsToFolder(
      oldPublicId,
      CLOUDINARY_FOLDERS.candidatePhotos,
    );

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
        console.warn(
          `Failed to delete old candidate photo ${oldPublicId}: ${error.message}`,
        );
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
          uploadedAt: new Date().toISOString(),
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

    const oldPublicId = sanitizePublicId(req.body?.oldPublicId);
    validateOldPublicIdBelongsToFolder(
      oldPublicId,
      CLOUDINARY_FOLDERS.voterDocuments,
    );

    const isPdf = req.file.mimetype === "application/pdf";
    const resourceType = isPdf ? "raw" : "image";

    const uploadedFile = await uploadOnCloudinary(req.file.path, {
      folder: CLOUDINARY_FOLDERS.voterDocuments,
      resourceType,
    });

    if (!uploadedFile?.secure_url || !uploadedFile?.public_id) {
      throw new ApiError(500, "Failed to upload voter document");
    }

    if (oldPublicId && oldPublicId !== uploadedFile.public_id) {
      try {
        const oldResourceType = oldPublicId.toLowerCase().endsWith(".pdf")
          ? "raw"
          : "image";

        await deleteFromCloudinary(oldPublicId, {
          resourceType: oldResourceType,
        });
      } catch (error) {
        console.warn(
          `Failed to delete old voter document ${oldPublicId}: ${error.message}`,
        );
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
          uploadedAt: new Date().toISOString(),
        },
        "Voter document uploaded successfully",
      ),
    );
  },
);
