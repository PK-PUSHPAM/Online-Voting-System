import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  getPendingVoters,
  getAllVoters,
  getVoterById,
  approveVoter,
  rejectVoter,
} from "../controllers/user.controller.js";
import {
  getPendingVotersSchema,
  getAllVotersSchema,
  getVoterByIdSchema,
  approveRejectVoterSchema,
} from "../validations/user.validation.js";

const router = express.Router();

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
