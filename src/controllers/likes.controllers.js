import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asynchandler";
import { ApiError } from "../utils/apierror";
import { Like } from "../models/like.model";
import { ApiResponse } from "../utils/apiresponse";
import { Video } from "../models/video.model";
import { Comment } from "../models/comments";
import { Tweet } from "../models/tweets.model";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await Like.findOneAndDelete({
      video: videoId,
      likedBy: req.user._id,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Video unliked successfully"));
  } else {
    const newLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    res
      .status(200)
      .json(new ApiResponse(200, newLike, "Video liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "comment does not exist");

  const comment = await Comment.findById(commentId);

  if (!comment) throw new ApiError(404, "comment does not exist");

  const commentLike = await Like.find(
    { comment: commentId },
    { likedBy: req.user._id }
  );

  if (commentLike) {
    const deletedLike = await Like.findOneAndDelete({
      comment: commentId,
      likedBy: req.user._id,
    });

    res.status(200),
      json(
        200,
        new ApiResponse(
          200,
          deletedLike,
          "Comment Like has been deleted successfully"
        )
      );
    return;
  }

  const createdLike = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, createdLike, "Comment has been Liked successfully")
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID format");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const deletedLike = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (deletedLike) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Comment unliked successfully")
      );
  }

  const createdLike = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { liked: true, like: createdLike },
        "Comment liked successfully"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID format");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const deletedLike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (deletedLike) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Tweet unliked successfully")
      );
  }

  const createdLike = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { liked: true, like: createdLike },
        "Tweet liked successfully"
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideoLikes = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null },
  }).populate("video");

  if (!likedVideoLikes || likedVideoLikes.length === 0) {
    throw new ApiError(404, "You have not liked any videos");
  }

  const likedVideos = likedVideoLikes
    .map((like) => like.video)
    .filter((video) => video);

  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Videos have been fetched successfully")
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
