import mongoose from "mongoose";

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "ended"],
      default: "upcoming",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    allowedVoterType: {
      type: String,
      enum: ["all", "verifiedOnly"],
      default: "verifiedOnly",
    },
  },
  { timestamps: true },
);

electionSchema.index({ title: 1 }, { unique: true });
electionSchema.index({ isPublished: 1, status: 1, startDate: 1 });
electionSchema.index({ createdBy: 1, createdAt: -1 });

const Election = mongoose.model("Election", electionSchema);

export default Election;
