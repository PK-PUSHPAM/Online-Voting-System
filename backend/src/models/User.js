import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ["super_admin", "admin", "voter"],
      default: "voter",
      index: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    ageVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    mobileVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    verificationRejectionReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    verificationNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    isEligibleToVote: {
      type: Boolean,
      default: false,
      index: true,
    },

    internalVoterId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },

    identityType: {
      type: String,
      enum: ["voterId", "collegeId", "aadhaarLast4", "other"],
      default: "other",
    },

    identityLast4: {
      type: String,
      trim: true,
      maxlength: 4,
    },

    documentUrl: {
      type: String,
      trim: true,
      default: "",
    },

    documentPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
      index: true,
    },

    refreshToken: {
      type: String,
      default: "",
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, verificationStatus: 1, createdAt: -1 });
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

const User = mongoose.model("User", userSchema);

export default User;
