import mongoose from "mongoose";

const publicChatMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deleteReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
  },
  { timestamps: true },
);

publicChatMessageSchema.index({ createdAt: -1 });
publicChatMessageSchema.index({ senderId: 1, createdAt: -1 });

const PublicChatMessage = mongoose.model(
  "PublicChatMessage",
  publicChatMessageSchema,
);

export default PublicChatMessage;
