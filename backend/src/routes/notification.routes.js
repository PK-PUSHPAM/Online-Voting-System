import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  getMySystemNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteMyNotification,
  clearMyReadNotifications,
  createAdminSystemNotification,
} from "../controllers/notification.controller.js";
import {
  getMySystemNotificationsSchema,
  markNotificationAsReadSchema,
  markAllNotificationsAsReadSchema,
  deleteMyNotificationSchema,
  clearMyReadNotificationsSchema,
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

router.delete(
  "/clear-read",
  verifyJWT,
  validate(clearMyReadNotificationsSchema),
  clearMyReadNotifications,
);

router.patch(
  "/:notificationId/read",
  verifyJWT,
  validate(markNotificationAsReadSchema),
  markNotificationAsRead,
);

router.delete(
  "/:notificationId",
  verifyJWT,
  validate(deleteMyNotificationSchema),
  deleteMyNotification,
);

router.post(
  "/admin/create",
  verifyJWT,
  authorizeRoles("admin", "super_admin"),
  validate(createAdminSystemNotificationSchema),
  createAdminSystemNotification,
);

export default router;
