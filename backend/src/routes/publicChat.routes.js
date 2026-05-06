import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  getMyPublicChatStatus,
  getPublicChatMessages,
  sendPublicChatMessage,
  deletePublicChatMessage,
  blockUserFromPublicChat,
  unblockUserFromPublicChat,
  getPublicChatBlockedUsers,
  streamPublicChatEvents,
} from "../controllers/publicChat.controller.js";
import {
  getMyPublicChatStatusSchema,
  getPublicChatMessagesSchema,
  sendPublicChatMessageSchema,
  deletePublicChatMessageSchema,
  blockUserFromPublicChatSchema,
  unblockUserFromPublicChatSchema,
  getPublicChatBlockedUsersSchema,
} from "../validations/publicChat.validation.js";

const router = express.Router();

router.get(
  "/public/status",
  verifyJWT,
  validate(getMyPublicChatStatusSchema),
  getMyPublicChatStatus,
);

router.get(
  "/public/messages",
  verifyJWT,
  validate(getPublicChatMessagesSchema),
  getPublicChatMessages,
);

router.post(
  "/public/messages",
  verifyJWT,
  validate(sendPublicChatMessageSchema),
  sendPublicChatMessage,
);

router.get("/public/stream", verifyJWT, streamPublicChatEvents);

router.delete(
  "/public/messages/:messageId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(deletePublicChatMessageSchema),
  deletePublicChatMessage,
);

router.patch(
  "/public/block/:userId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(blockUserFromPublicChatSchema),
  blockUserFromPublicChat,
);

router.patch(
  "/public/unblock/:userId",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(unblockUserFromPublicChatSchema),
  unblockUserFromPublicChat,
);

router.get(
  "/public/blocked-users",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(getPublicChatBlockedUsersSchema),
  getPublicChatBlockedUsers,
);

export default router;
