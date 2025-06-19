import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      types: Schema.Types.ObjectId,
      // one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      // one to whom a user is subscribing
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const subscription = mongoose.model("subscription", subscriptionSchema);
