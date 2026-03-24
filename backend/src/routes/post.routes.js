import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  createPost,
  getPostsByElection,
  getPostById,
  updatePost,
  deletePost,
  getActivePostsWithCandidatesForElection,
} from "../controllers/post.controller.js";

const router = express.Router();

router.post(
  "/create/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  createPost,
);

router.get(
  "/election/:electionId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getPostsByElection,
);

router.get(
  "/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  getPostById,
);

router.patch(
  "/update/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  updatePost,
);

router.delete(
  "/delete/:postId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  deletePost,
);

router.get(
  "/voter/election/:electionId",
  verifyJWT,
  authorizeRoles("voter"),
  getActivePostsWithCandidatesForElection,
);
export default router;
