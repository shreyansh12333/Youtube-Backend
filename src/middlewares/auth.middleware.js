import { asyncHandler } from "../utils/asynchandler.js";

import { ApiError } from "../utils/apierror.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async function (req, res, next) {
  try {
    const token =
      req.cookies?.accessToken || req.headers.authorization.split(" ")[1];
    console.log(token);
    if (!token) {
      throw new ApiError(409, "Unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-refreshToken -password"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(409, error?.message || "Invalid Access Token");
  }
});
export default verifyJwt;
