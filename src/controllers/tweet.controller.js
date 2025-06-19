import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweets.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";

const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { tweet } = req.body;

  if (!tweet?.trim() && tweet.length > 280)
    throw new ApiError(400, "Invalid request");

  if (!isValidObjectId(userId)) throw new ApiError(400, "UserId is not valid");

  const user = await User.findById(userId);

  if (!user) throw new ApiError(400, "User does not exist");

  const tweetCreated = await Tweet.create({
    content: tweet.trim(),
    owner: userId,
  });
  const newTweet = await Tweet.findById(tweetCreated._id).populate("owner");
  if (!newTweet) {
    throw new ApiError(400, "Something happened while creating the tweet");
  }
  res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }

  if (typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Content must be a non-empty string");
  }

  if (content.trim().length > 280) {
    throw new ApiError(400, "Content must be 280 characters or fewer");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  tweet.content = content.trim();
  await tweet.save();

  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  console.log("hello");
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet ID is not valid");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet does not exist");
  }

  if (tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(500, "Something went wrong while deleting the tweet");
  }

  console.log(deleteTweet);
  res
    .status(200)
    .json(
      new ApiResponse(200, deletedTweet, "Tweet has been successfully deleted")
    );
});

const getAllTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const tweets = await Tweet.find({ owner: userId });

  if (!tweets)
    throw new ApiError(400, "Something happened while finding all the tweets");

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets are successfully fetched"));
});

export { createTweet, updateTweet, deleteTweet, getAllTweets };
