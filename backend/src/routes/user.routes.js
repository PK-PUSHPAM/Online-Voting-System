import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  uploadProfilePhoto,
  uploadVoterDocument,
} from "../middleware/multer.middleware.js";
import {
  getPendingVoters,
  getAllVoters,
  getVoterById,
  approveVoter,
  rejectVoter,
  updateMyProfile,
  uploadMyProfilePhoto,
  removeMyProfilePhoto,
  uploadMyVoterDocument,
  changeMyPassword,
} from "../controllers/user.controller.js";
import {
  getPendingVotersSchema,
  getAllVotersSchema,
  getVoterByIdSchema,
  approveRejectVoterSchema,
  updateMyProfileSchema,
  changeMyPasswordSchema,
} from "../validations/user.validation.js";

const router = express.Router();

router.patch(
  "/me/profile",
  verifyJWT,
  authorizeRoles("voter"),
  validate(updateMyProfileSchema),
  updateMyProfile,
);

router.patch(
  "/me/profile-photo",
  verifyJWT,
  authorizeRoles("voter"),
  uploadProfilePhoto,
  uploadMyProfilePhoto,
);

router.delete(
  "/me/profile-photo",
  verifyJWT,
  authorizeRoles("voter"),
  removeMyProfilePhoto,
);

router.patch(
  "/me/document",
  verifyJWT,
  authorizeRoles("voter"),
  uploadVoterDocument,
  uploadMyVoterDocument,
);

router.patch(
  "/me/change-password",
  verifyJWT,
  authorizeRoles("voter"),
  validate(changeMyPasswordSchema),
  changeMyPassword,
);

router.get(
  "/pending-voters",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getPendingVotersSchema),
  getPendingVoters,
);

router.get(
  "/all-voters",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getAllVotersSchema),
  getAllVoters,
);

router.get(
  "/voter/:userId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getVoterByIdSchema),
  getVoterById,
);

router.patch(
  "/approve-voter/:userId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(approveRejectVoterSchema),
  approveVoter,
);

router.patch(
  "/reject-voter/:userId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(approveRejectVoterSchema),
  rejectVoter,
);

export default router;
