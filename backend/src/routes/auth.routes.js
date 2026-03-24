import express from "express";
import {
  sendOtp,
  verifyOtpAndRegister,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  sendOtpSchema,
  registerSchema,
  loginSchema,
} from "../validations/auth.validation.js";

const router = express.Router();

router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

router.post("/refresh-token", refreshAccessToken);

router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);

export default router;
