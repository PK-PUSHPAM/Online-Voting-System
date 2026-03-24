import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  uploadCandidatePhoto,
  uploadVoterDocument,
} from "../middleware/multer.middleware.js";
import {
  uploadCandidatePhotoToCloudinary,
  uploadVoterDocumentToCloudinary,
} from "../controllers/upload.controller.js";

const router = express.Router();

/*
  Admin uploads candidate photo.
  field name: candidatePhoto
*/
router.post(
  "/candidate-photo",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  uploadCandidatePhoto,
  uploadCandidatePhotoToCloudinary,
);

/*
  Public route for voter registration document upload.
  field name: document
*/
router.post(
  "/voter-document",
  uploadVoterDocument,
  uploadVoterDocumentToCloudinary,
);

export default router;
