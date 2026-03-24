import { Router } from "express";
import {
  sendOtp,
  verifyOtpAndRegister,
  loginUser,
  loginWithOtp,
  resetPasswordWithOtp,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import validate from "../middleware/validate.middleware.js";
import verifyJWT from "../middleware/auth.middleware.js";

import {
  sendOtpSchema,
  registerSchema,
  loginSchema,
  loginWithOtpSchema,
  resetPasswordWithOtpSchema,
} from "../validations/auth.validation.js";

const router = Router();

router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/register", validate(registerSchema), verifyOtpAndRegister);
router.post("/login", validate(loginSchema), loginUser);
router.post("/login-with-otp", validate(loginWithOtpSchema), loginWithOtp);
router.post(
  "/reset-password",
  validate(resetPasswordWithOtpSchema),
  resetPasswordWithOtp,
);

router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);

export default router;
