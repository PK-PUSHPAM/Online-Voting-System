import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    mobileNumber: {
      type: String,
      trim: true,
      default: "",
    },

    partyName: {
      type: String,
      trim: true,
      default: "",
    },

    partySymbolUrl: {
      type: String,
      trim: true,
      default: "",
    },

    candidatePhotoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    photoPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    manifesto: {
      type: String,
      trim: true,
      default: "",
    },

    isApproved: {
      type: Boolean,
      default: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

candidateSchema.index(
  { electionId: 1, postId: 1, fullName: 1 },
  { unique: true },
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
