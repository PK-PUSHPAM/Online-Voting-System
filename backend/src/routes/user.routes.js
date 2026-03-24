import express from "express";
import {
  getPendingVoters,
  approveVoter,
  rejectVoter,
} from "../controllers/user.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  getPendingVotersSchema,
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

router.patch(
  "/approve/:userId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(approveRejectVoterSchema),
  approveVoter,
);

router.patch(
  "/reject/:userId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(approveRejectVoterSchema),
  rejectVoter,
);

export default router;
