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
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "ended"],
      default: "upcoming",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    allowedVoterType: {
      type: String,
      enum: ["all", "verifiedOnly"],
      default: "verifiedOnly",
    },
  },
  { timestamps: true },
);

const Election = mongoose.model("Election", electionSchema);

export default Election;
