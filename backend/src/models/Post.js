import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      immutable: true,
      index: true,
    },

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

    maxVotesPerVoter: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1,
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

postSchema.index({ electionId: 1, title: 1 }, { unique: true });
postSchema.index({ electionId: 1, displayOrder: 1, createdAt: 1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
