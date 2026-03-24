import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  castVote,
  getMyVotes,
  getVotesByElectionForAdmin,
} from "../controllers/vote.controller.js";

const router = express.Router();

router.post("/cast", verifyJWT, authorizeRoles("voter"), castVote);

router.get("/my-votes", verifyJWT, authorizeRoles("voter"), getMyVotes);

router.get(
  "/election/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getVotesByElectionForAdmin,
);

export default router;
