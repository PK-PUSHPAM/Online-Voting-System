import fs from "fs";
import path from "path";
import multer from "multer";
import ApiError from "../utils/ApiError.js";

const TEMP_UPLOAD_DIR = path.resolve("public/temp");
const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;

const ALLOWED_PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

const sanitizeFileName = (fileName = "") => {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension);

  const safeBaseName = baseName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 60);

  return `${safeBaseName || "profile-photo"}${extension}`;
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, TEMP_UPLOAD_DIR);
  },

  filename(req, file, cb) {
    const safeFileName = sanitizeFileName(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${uniqueSuffix}-${safeFileName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        "Invalid profile photo type. Only JPG, PNG, and WEBP images are allowed.",
      ),
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_PROFILE_PHOTO_SIZE,
    files: 1,
  },
}).single("profilePhoto");

const cleanupTempFile = (req) => {
  try {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  } catch (error) {
    console.warn(`Failed to cleanup profile photo temp file: ${error.message}`);
  }
};

export const uploadProfilePhoto = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    cleanupTempFile(req);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          new ApiError(
            400,
            "Profile photo must be less than or equal to 2 MB.",
          ),
        );
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          new ApiError(
            400,
            "Unexpected file field. Use profilePhoto as the file field name.",
          ),
        );
      }

      return next(new ApiError(400, error.message));
    }

    return next(error);
  });
};
