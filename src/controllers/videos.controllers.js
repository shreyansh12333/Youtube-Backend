import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { isValidObjectId } from "mongoose";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoLocalPath = req.file?.path;

  if (!videoLocalPath) throw new ApiError(404, "File does not exist");
  if (!title || !description)
    throw new ApiError(400, "Title and description are required");

  const cloudinaryResponse = await uploadOnCloudinary(videoLocalPath);
  const originalUrl = cloudinaryResponse.secure_url; // This is correct

  const duration = Math.round(cloudinaryResponse.duration || 0);

  const thumbnailUrl = originalUrl.replace(
    "/upload/",
    "/upload/w_200,h_200,c_fill/"
  );

  const uploadedVideo = await Video.create({
    title,
    description,
    videoFile: originalUrl,
    duration,
    thumbnail: thumbnailUrl,
    owner: req.user._id,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        uploadedVideo,
        "Video has been successfully uploaded"
      )
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID must be provided");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId).select(
    "_id title description isPublished createdAt owner"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to access this video");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: video._id,
        title: video.title,
        description: video.description,
        isPublished: video.isPublished,
        createdAt: video.createdAt,
      },
      "Video successfully retrieved"
    )
  );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "VideoId must be provided");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: req.user._id,
    },
    [{ $set: { isPublished: { $not: "$isPublished" } } }],
    { new: true, select: "_id isPublished" }
  );

  if (!video) {
    throw new ApiError(404, "Video not found or unauthorized");
  }
  res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: video._id,
        isPublished: video.isPublished,
      },
      "Publishing status successfully toggled"
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is not defined");

  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim())
    throw new ApiError(400, "Title and description are required");

  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiError(400, "videoId is not valid");

  const oldVideo = await Video.findById(videoId);

  if (!oldVideo.owner.equals(req.user._id))
    throw new ApiError(403, "You are not authorized to update the video");

  const response = await uploadOnCloudinary(thumbnailLocalPath);

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: response?.url,
      },
    },
    { new: true }
  );

  if (!video)
    throw new ApiError(500, "Something happened while updating the thumbnail");

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video has been successfully updated"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "VideoId must be provided");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const videoData = {
    _id: video._id,
    title: video.title,
    owner: video.owner,
  };

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Failed to delete video from database");
  }

  if (video.videoFile) {
    deleteFromCloudinary(video.videoFile, "video").catch(console.error);
  }
  if (video.thumbnail) {
    deleteFromCloudinary(video.thumbnail, "image").catch(console.error);
  }

  res
    .status(200)
    .json(new ApiResponse(200, videoData, "Video deleted successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;
  const filter = {};

  if (userId) {
    if (!isValidObjectId(userId))
      throw new ApiError(400, "UserId does not exist");
    filter.owner = userId;
  }

  const sortArray = ["views", "title", "description", "createdAt", "updatedAt"];

  const sort = {};
  if (sortBy && sortArray.includes(sortBy)) {
    sort[sortBy] = sortType === "des" ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  if (query?.trim()) {
    filter.$or = [
      { title: { $regex: query.trim(), $options: "i" } },
      { description: { $regex: query.trim(), $options: "i" } },
    ];
  }

  const [videos, totalVideos] = await Promise.all([
    Video.find(filter)
      .select("-__v")
      .skip(skip)
      .limit(limitNum)
      .sort(sort)
      .lean(),
    Video.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalVideos / limitNum);

  const hasNextPage = pageNum < totalPages;

  const hasPrevPage = pageNum > 1;

  const response = {
    videos,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalVideos,
      videosPerPage: limitNum,
      hasNextPage,
      hasPrevPage,
      nextPage: nextPage ? pageNum + 1 : null,
      prevPage: prevPage ? pageNum - 1 : null,
    },
    filters: {
      query: query || null,
      sortBy,
      sortType,
      userId: userId || null,
    },
  };

  if (videos.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, response, "No videos found matching the criteria")
      );
  }

  res
    .status(200)
    .json(new ApiResponse(200, response, "Videos fetched successfully"));
});

export {
  publishAVideo,
  getVideoById,
  togglePublishStatus,
  updateVideo,
  deleteVideo,
  getAllVideos,
};
