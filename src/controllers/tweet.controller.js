import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweets.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asynchandler";
import { ApiError } from "../utils/apierror";
import { ApiResponse } from "../utils/apiresponse";

const createTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { tweet } = req.body;

  if (!tweet?.trim() && tweet.length > 280)
    throw new ApiError(400, "Invalid request");

  if (!isValidObjectId(userId)) throw new ApiError(400, "UserId is not valid");

  const user = await User.findById(userId);

  if (!user) throw new ApiError(400, "User does not exist");

  const tweetCreated = await Tweet.create({
    content: tweet.trim(),
    owner: userIds,
  });

  if (!tweetCreated) {
    throw new ApiError(400, "Something happened while creating the tweet");
  }
  res
    .status(201)
    .json(new ApiResponse(201, tweetCreated, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const content = req.body;
  if (!content?.trim() && content.length < 280)
    throw new ApiError(400, "Content must be there");
  
});

export { createTweet, updateTweet };
