import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
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
      default: 1,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

postSchema.index({ electionId: 1, title: 1 }, { unique: true });

const Post = mongoose.model("Post", postSchema);

export default Post;
