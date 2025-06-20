import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { Playlist } from "../models/playlists.model.js";
import { ApiResponse } from "../utils/apiresponse";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and description are required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!videoId || !playlistId) {
    throw new ApiError(400, "VideoId and PlaylistId must be provided");
  }

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "VideoId and PlaylistId must be valid");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.isPublished && !video.owner.equals(req.user._id)) {
    throw new ApiError(403, "Cannot add unpublished video that you don't own");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(409, "Video already exists in the playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "PlaylistId must be provided");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId format");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner._id.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to view this playlist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID format");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "Unauthorized: You can only delete your own playlists"
    );
  }

  await Playlist.findByIdAndDelete(playlistId);

  res
    .status(200)
    .json(
      new ApiResponse(200, { id: playlistId }, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const { playlistId } = req.params;

  if (!title?.trim() && !description?.trim()) {
    throw new ApiError(400, "At least title or description is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID format");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "Unauthorized: You can only update your own playlists"
    );
  }

  if (title?.trim()) {
    playlist.title = title.trim();
  }

  if (description?.trim()) {
    playlist.description = description.trim();
  }

  await playlist.save();

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid video ID or playlist ID format");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "Unauthorized: You can only modify your own playlists"
    );
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, "Video not found in this playlist");
  }

  playlist.videos = playlist.videos.filter((id) => !id.equals(videoId));

  await playlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        playlists,
        count: playlists.length,
      },
      playlists.length === 0
        ? "No playlists found"
        : `${playlists.length} playlist(s) fetched successfully`
    )
  );
});

export {
  createPlaylist,
  addVideoToPlaylist,
  getPlaylistById,
  deletePlaylist,
  updatePlaylist,
  removeVideoFromPlaylist,
  getUserPlaylists,
};
