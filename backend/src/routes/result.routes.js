import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  getElectionResultsForAdmin,
  getPostResultForAdmin,
  getResultElectionsForVoter,
  getElectionResultsForVoter,
} from "../controllers/result.controller.js";

const router = express.Router();

router.get(
  "/voter/elections",
  verifyJWT,
  authorizeRoles("voter"),
  getResultElectionsForVoter,
);

router.get(
  "/voter/election/:electionId",
  verifyJWT,
  authorizeRoles("voter"),
  getElectionResultsForVoter,
);

router.get(
  "/election/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getElectionResultsForAdmin,
);

router.get(
  "/election/:electionId/post/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getPostResultForAdmin,
);

export default router;
