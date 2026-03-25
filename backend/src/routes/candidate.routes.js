import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createCandidate,
  getCandidatesByPost,
  getCandidatesByElection,
  getCandidateById,
  updateCandidate,
  approveCandidate,
  deleteCandidate,
} from "../controllers/candidate.controller.js";
import {
  createCandidateSchema,
  getCandidatesByPostSchema,
  getCandidatesByElectionSchema,
  getCandidateByIdSchema,
  updateCandidateSchema,
  approveCandidateSchema,
  deleteCandidateSchema,
} from "../validations/candidate.validation.js";

const router = express.Router();

router.post(
  "/create/:electionId/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(createCandidateSchema),
  createCandidate,
);

router.get(
  "/post/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getCandidatesByPostSchema),
  getCandidatesByPost,
);

router.get(
  "/election/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getCandidatesByElectionSchema),
  getCandidatesByElection,
);

router.get(
  "/:candidateId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getCandidateByIdSchema),
  getCandidateById,
);

router.patch(
  "/update/:candidateId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(updateCandidateSchema),
  updateCandidate,
);

router.patch(
  "/approve/:candidateId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(approveCandidateSchema),
  approveCandidate,
);

router.delete(
  "/delete/:candidateId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(deleteCandidateSchema),
  deleteCandidate,
);

export default router;
