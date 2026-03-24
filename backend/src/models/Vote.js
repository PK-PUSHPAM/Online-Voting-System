import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

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

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      immutable: true,
      index: true,
    },

    votedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Same voter can not vote for the same candidate twice in same post/election
voteSchema.index(
  { voterId: 1, electionId: 1, postId: 1, candidateId: 1 },
  { unique: true },
);

// Helpful admin/result indexes
voteSchema.index({ electionId: 1, postId: 1, candidateId: 1 });
voteSchema.index({ voterId: 1, electionId: 1, postId: 1 });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;
