import fs from "fs";
import path from "path";
import multer from "multer";
import ApiError from "../utils/ApiError.js";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_CANDIDATE_PHOTO_SIZE,
  MAX_VOTER_DOCUMENT_SIZE,
} from "../constants/upload.constants.js";

const tempUploadDir = path.resolve("public/temp");

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadDir);
  },
  filename: function (req, file, cb) {
    const sanitizedOriginalName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  },
});

const createFileFilter = (allowedMimeTypes, fileLabel) => {
  return (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new ApiError(
          400,
          `Invalid ${fileLabel} file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
        ),
      );
    }

    cb(null, true);
  };
};

const createUploader = ({ allowedMimeTypes, maxFileSize, fileLabel }) => {
  return multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: 1,
    },
    fileFilter: createFileFilter(allowedMimeTypes, fileLabel),
  });
};

const handleMulterError = (uploader) => {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new ApiError(400, `File too large. Maximum allowed size exceeded.`),
          );
        }

        return next(new ApiError(400, err.message));
      }

      return next(err);
    });
  };
};

export const uploadCandidatePhoto = handleMulterError(
  createUploader({
    allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    maxFileSize: MAX_CANDIDATE_PHOTO_SIZE,
    fileLabel: "candidate photo",
  }).single("candidatePhoto"),
);

export const uploadVoterDocument = handleMulterError(
  createUploader({
    allowedMimeTypes: ALLOWED_DOCUMENT_MIME_TYPES,
    maxFileSize: MAX_VOTER_DOCUMENT_SIZE,
    fileLabel: "voter document",
  }).single("document"),
);
