import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      immutable: true,
      index: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      immutable: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    partyName: {
      type: String,
      trim: true,
      default: "",
    },

    manifesto: {
      type: String,
      trim: true,
      default: "",
    },

    candidatePhotoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    candidatePhotoPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

candidateSchema.index(
  { electionId: 1, postId: 1, fullName: 1 },
  { unique: true },
);
candidateSchema.index(
  { electionId: 1, postId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: "objectId" } },
  },
);
candidateSchema.index({
  electionId: 1,
  postId: 1,
  approvalStatus: 1,
  displayOrder: 1,
});

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
