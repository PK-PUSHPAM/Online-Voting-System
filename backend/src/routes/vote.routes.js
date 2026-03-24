import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  castVote,
  getMyVotes,
  getVotesByElectionForAdmin,
} from "../controllers/vote.controller.js";
import {
  castVoteSchema,
  getMyVotesSchema,
  getVotesByElectionForAdminSchema,
} from "../validations/vote.validation.js";

const router = express.Router();

router.post(
  "/cast",
  verifyJWT,
  authorizeRoles("voter"),
  validate(castVoteSchema),
  castVote,
);

router.get(
  "/my-votes",
  verifyJWT,
  authorizeRoles("voter"),
  validate(getMyVotesSchema),
  getMyVotes,
);

router.get(
  "/election/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getVotesByElectionForAdminSchema),
  getVotesByElectionForAdmin,
);

export default router;
