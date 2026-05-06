import mongoose from "mongoose";

const publicChatBlockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    unblockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    unblockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

publicChatBlockSchema.index({ userId: 1, isActive: 1 });

const PublicChatBlock = mongoose.model(
  "PublicChatBlock",
  publicChatBlockSchema,
);

export default PublicChatBlock;
