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
  getActivePostsWithCandidatesForElection,
} from "../controllers/post.controller.js";
import {
  createPostSchema,
  getPostsByElectionSchema,
  getPostByIdSchema,
  updatePostSchema,
  deletePostSchema,
  getActivePostsWithCandidatesForElectionSchema,
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

router.get(
  "/voter/election/:electionId",
  verifyJWT,
  authorizeRoles("voter"),
  validate(getActivePostsWithCandidatesForElectionSchema),
  getActivePostsWithCandidatesForElection,
);

export default router;
