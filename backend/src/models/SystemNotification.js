import mongoose from "mongoose";

const systemNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
      index: true,
    },

    link: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    source: {
      type: String,
      enum: ["system", "admin", "election", "profile", "chat"],
      default: "system",
      index: true,
    },
  },
  { timestamps: true },
);

systemNotificationSchema.index({
  recipientId: 1,
  isRead: 1,
  createdAt: -1,
});

const SystemNotification = mongoose.model(
  "SystemNotification",
  systemNotificationSchema,
);

export default SystemNotification;
