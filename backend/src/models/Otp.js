import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
      select: false, // hashed OTP hidden
    },

    purpose: {
      type: String,
      enum: ["register", "login", "reset-password"],
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    maxAttempts: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true },
);

// 🔥 TTL index (auto delete expired OTP)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
