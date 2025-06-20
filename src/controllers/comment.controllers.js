import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asynchandler";
import { ApiError } from "../utils/apierror";
import { Video } from "../models/video.model";
import { Comment } from "../models/comments";
import { ApiResponse } from "../utils/apiresponse";

const addCommentToVideo = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    video: videoId,
    content: content.trim(),
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID format");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "Unauthorized: You can only update your own comments"
    );
  }

  comment.content = content.trim();
  await comment.save();

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID format");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "Unauthorized: You can only delete your own comments"
    );
  }

  await Comment.findByIdAndDelete(commentId);

  res
    .status(200)
    .json(
      new ApiResponse(200, { id: commentId }, "Comment deleted successfully")
    );
});


export { addCommentToVideo, updateComment, deleteComment };
