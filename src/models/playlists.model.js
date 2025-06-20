import mongoose, { Schema } from "mongoose";

const playlistsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    videos: [
      {
        ref: "Video",
        type: Schema.Types.ObjectId,
      },
    ],
    description: {
      type: String,
      required: true,
    },
    owner: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistsSchema);
