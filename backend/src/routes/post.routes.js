import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createPost,
  getPostsByElection,
  getPostById,
  updatePost,
  deletePost,
  getVisiblePostsWithCandidatesForVoter,
} from "../controllers/post.controller.js";
import {
  createPostSchema,
  getPostsByElectionSchema,
  getPostByIdSchema,
  updatePostSchema,
  deletePostSchema,
  getVisiblePostsWithCandidatesForVoterSchema,
} from "../validations/post.validation.js";

const router = express.Router();

router.post(
  "/create/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(createPostSchema),
  createPost,
);

router.get(
  "/election/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getPostsByElectionSchema),
  getPostsByElection,
);

router.get(
  "/voter/election/:electionId",
  verifyJWT,
  authorizeRoles("voter"),
  validate(getVisiblePostsWithCandidatesForVoterSchema),
  getVisiblePostsWithCandidatesForVoter,
);

router.get(
  "/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getPostByIdSchema),
  getPostById,
);

router.patch(
  "/update/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(updatePostSchema),
  updatePost,
);

router.delete(
  "/delete/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(deletePostSchema),
  deletePost,
);

export default router;
