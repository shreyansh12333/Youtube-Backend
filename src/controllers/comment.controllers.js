import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.js";
import { ApiResponse } from "../utils/apiresponse.js";

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

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "VideoId must be a valid ObjectId");
  }

  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(Math.max(1, parseInt(limit) || 10), 100);

  if (isNaN(pageNum) || isNaN(limitNum)) {
    throw new ApiError(400, "Page and limit must be valid numbers");
  }

  const skip = (pageNum - 1) * limitNum;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  const [comments, totalComments] = await Promise.all([
    Comment.find({ video: videoId })
      .populate("owner", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean(),
    Comment.countDocuments({ video: videoId }),
  ]);

  if (comments.length === 0 && pageNum > 1) {
    throw new ApiError(404, "No comments found for this page");
  }

  const totalPages = Math.ceil(totalComments / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        pagination: {
          totalComments,
          totalPages,
          currentPage: pageNum,
          perPage: limitNum,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
        },
      },
      "Comments fetched successfully"
    )
  );
});

export { addCommentToVideo, updateComment, deleteComment, getVideoComments };
