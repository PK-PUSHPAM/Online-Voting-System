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

const sanitizeFileName = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, ext);

  const safeBaseName = baseName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 60);

  return `${safeBaseName || "file"}${ext}`;
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, tempUploadDir);
  },
  filename(req, file, cb) {
    const safeName = sanitizeFileName(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${uniqueSuffix}-${safeName}`);
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

    if (!file.originalname || file.originalname.length > 200) {
      return cb(new ApiError(400, `Invalid ${fileLabel} file name`));
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

const cleanupUploadedTempFile = (req) => {
  try {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp upload file: ${error.message}`);
  }
};

const handleMulterError = (uploader, maxFileSize) => {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (!err) return next();

      cleanupUploadedTempFile(req);

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new ApiError(
              400,
              `File too large. Maximum allowed size is ${Math.ceil(
                maxFileSize / (1024 * 1024),
              )} MB.`,
            ),
          );
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(new ApiError(400, "Unexpected file field received"));
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
  MAX_CANDIDATE_PHOTO_SIZE,
);

export const uploadVoterDocument = handleMulterError(
  createUploader({
    allowedMimeTypes: ALLOWED_DOCUMENT_MIME_TYPES,
    maxFileSize: MAX_VOTER_DOCUMENT_SIZE,
    fileLabel: "voter document",
  }).single("document"),
  MAX_VOTER_DOCUMENT_SIZE,
);
