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

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/register", verifyOtpAndRegister);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);

export default router;
