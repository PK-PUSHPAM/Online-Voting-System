import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { getAllAdmins } from "../controllers/admin.controller.js";
import {
  createAdmin,
  updateAdminStatus,
  changeAdminRole,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post(
  "/create-admin",
  verifyJWT,
  authorizeRoles("super_admin"),
  createAdmin,
);

router.patch(
  "/update-status/:userId",
  verifyJWT,
  authorizeRoles("super_admin"),
  updateAdminStatus,
);

router.patch(
  "/change-role/:userId",
  verifyJWT,
  authorizeRoles("super_admin"),
  changeAdminRole,
);

router.get(
  "/all-admins",
  verifyJWT,
  authorizeRoles("super_admin"),
  getAllAdmins,
);

export default router;
