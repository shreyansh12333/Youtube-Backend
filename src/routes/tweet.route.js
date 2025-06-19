import express from "express";
import {
  createTweet,
  deleteTweet,
  getAllTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/create").post(verifyJwt, createTweet);

router.route("/getAllTweets").get(verifyJwt, getAllTweets);

router.route("/:tweetId").delete(verifyJwt, deleteTweet);

router.route("/:tweetId").patch(verifyJwt, updateTweet);

export default router;
