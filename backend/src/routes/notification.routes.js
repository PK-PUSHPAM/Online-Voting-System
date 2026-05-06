import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  getMySystemNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createAdminSystemNotification,
} from "../controllers/notification.controller.js";
import {
  getMySystemNotificationsSchema,
  markNotificationAsReadSchema,
  markAllNotificationsAsReadSchema,
  createAdminSystemNotificationSchema,
} from "../validations/notification.validation.js";

const router = express.Router();

router.get(
  "/me",
  verifyJWT,
  validate(getMySystemNotificationsSchema),
  getMySystemNotifications,
);

router.patch(
  "/mark-all-read",
  verifyJWT,
  validate(markAllNotificationsAsReadSchema),
  markAllNotificationsAsRead,
);

router.patch(
  "/:notificationId/read",
  verifyJWT,
  validate(markNotificationAsReadSchema),
  markNotificationAsRead,
);

router.post(
  "/admin/create",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(createAdminSystemNotificationSchema),
  createAdminSystemNotification,
);

export default router;
