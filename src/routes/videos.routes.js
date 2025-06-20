import express from "express";
import { publishAVideo } from "../controllers/videos.controllers.js";
import { upload } from "../middlewares/multer.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const Router = express.Router();

Router.use(verifyJwt);

Router.route("/publish").post(upload.single("file"), publishAVideo);

export default Router;
