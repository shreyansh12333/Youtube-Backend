import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  owner: {
    ref: "User",
    type: Schema.Types.ObjectId,
  },
});

export const Tweet = mongoose.model("Tweet", tweetSchema);
