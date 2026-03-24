import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  createCandidate,
  getCandidatesByPost,
  getCandidatesByElection,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} from "../controllers/candidate.controller.js";

const router = express.Router();

router.post(
  "/create/:electionId/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  createCandidate,
);

router.get(
  "/post/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getCandidatesByPost,
);

router.get(
  "/election/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getCandidatesByElection,
);

router.get(
  "/:candidateId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getCandidateById,
);

router.patch(
  "/update/:candidateId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  updateCandidate,
);

router.delete(
  "/delete/:candidateId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  deleteCandidate,
);

export default router;
