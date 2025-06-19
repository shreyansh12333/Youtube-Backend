import mongoose from "mongoose";

const likeSchema = new Schema(
  {
    video: {
      ref: "Video",
      type: Schema.Types.ObjectId,
    },
    comment: {
      ref: "Comment",
      type: Schema.Types.ObjectId,
    },
    tweet: {
      ref: "Tweet",
      type: Schema.Types.ObjectId,
    },
    likedBy: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
  },
  { timeStamps: true }
);
