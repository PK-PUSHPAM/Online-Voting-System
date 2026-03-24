import express from "express";
import verifyJWT from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createAdmin,
  updateAdminStatus,
  changeAdminRole,
  getAllAdmins,
} from "../controllers/admin.controller.js";
import {
  createAdminSchema,
  updateAdminStatusSchema,
  changeAdminRoleSchema,
  getAllAdminsSchema,
} from "../validations/admin.validation.js";

const router = express.Router();

router.post(
  "/create-admin",
  verifyJWT,
  authorizeRoles("super_admin"),
  validate(createAdminSchema),
  createAdmin,
);

router.patch(
  "/update-status/:userId",
  verifyJWT,
  authorizeRoles("super_admin"),
  validate(updateAdminStatusSchema),
  updateAdminStatus,
);

router.patch(
  "/change-role/:userId",
  verifyJWT,
  authorizeRoles("super_admin"),
  validate(changeAdminRoleSchema),
  changeAdminRole,
);

router.get(
  "/all-admins",
  verifyJWT,
  authorizeRoles("super_admin"),
  validate(getAllAdminsSchema),
  getAllAdmins,
);

export default router;
