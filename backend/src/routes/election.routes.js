import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  deleteElection,
  getActivePublishedElectionsForVoter,
} from "../controllers/election.controller.js";
import {
  createElectionSchema,
  getAllElectionsSchema,
  getElectionByIdSchema,
  updateElectionSchema,
  deleteElectionSchema,
  getActivePublishedElectionsForVoterSchema,
} from "../validations/election.validation.js";

const router = express.Router();

router.post(
  "/create",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(createElectionSchema),
  createElection,
);

router.get(
  "/all",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getAllElectionsSchema),
  getAllElections,
);

router.get(
  "/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getElectionByIdSchema),
  getElectionById,
);

router.patch(
  "/update/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(updateElectionSchema),
  updateElection,
);

router.delete(
  "/delete/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(deleteElectionSchema),
  deleteElection,
);

router.get(
  "/voter/active",
  verifyJWT,
  authorizeRoles("voter"),
  validate(getActivePublishedElectionsForVoterSchema),
  getActivePublishedElectionsForVoter,
);

export default router;
