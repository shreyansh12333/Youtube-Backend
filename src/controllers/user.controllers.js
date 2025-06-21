import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const refreshToken = user.generateAccessToken();
  const accessToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });
  return { refreshToken, accessToken };
};
const options = {
  httpOnly: true,
  secure: true,
};
const registerUser = asyncHandler(async (req, res) => {
  // res.status(201).json({
  //   message: "hello api",
  // });
  // get users from the frontend
  // validation- not empty
  // check if user already exists-username or email
  // check for images
  // check for cover images and avatar
  // upload them on cloudinary,avatar
  // create user object-create entry in db
  // remove password and refresh token field
  const { fullName, email, username, password } = req.body;
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  
  console.log(username);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    throw new ApiError(400, "username or email is not correct");
  }

  const isPasswordVerified = await user.isPasswordCorrect(password);
  if (!isPasswordVerified) {
    throw new ApiError(404, "User does not exist");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  console.log(accessToken, refreshToken);
  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password"
  );
  const options = {
    selectOnly: true,
    secure: true,
  };
  return res
    .cookie("AccessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User logged Successfully"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    http: true,
    secure: true,
  };
  return res
    .clearCookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decode = jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );



    if (!decode) {
      throw new ApiError(401, "Invalid refreshToken");
    }
    
    const user = await User.findById(decode?._id);
    if (user?.refreshToken === incomingRefreshToken) {
      const { newAccessToken, newRefreshToken } =
        await generateAccessAndRefreshToken(user._id);
      res
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
          new ApiResponse(
            201,
            { accessToken: newAccessToken, refreshToken: newRefreshToken },
            "Access token is refreshed successfully"
          )
        );
    } else {
      throw new ApiError(401, "Refresh token is expired or used");
    }
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, oldPassword } = req.body;
  const user = await User.findById(req.user?.id);
  const passwordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!passwordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = currentPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing");
  }
  const image = await uploadOnCloudinary(coverImageLocalPath);
  if (!image?.url) {
    throw new ApiResponse(400, "Error while uploading the cover image");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: image.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover image has been uploaded successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing");
  }
  const avatar = uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "File could not be uploaded");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "Username not found");
  }
  const channel = await User.aggregate([
    {
      $match: {
        $userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscriber",
        },
        channelSubscribed: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscriberCount: 1,
        channelSubscriberToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);
  if (!channel.length) {
    throw new ApiError(404, "Invalid request");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User fetched successfully"));
});

export {
  registerUser,
  logout,
  loginUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateCoverImage,
  updateAvatar,
  refreshAccessToken,
  getUserChannelProfile,
};

// User.aggregate([
//   {
//     $match: {
//       city: "New York",
//       age: { $gte: 25 },
//     },
//   },
// ]);

// User.aggregate([
//   {
//     $match: {
//       category: "Electronics",
//       price: { $gte: 50, $lte: 200 },
//       rating: { $gte: 4.0 },
//       stock: { $gte: 4 },
//     },
//   },
// ]);

// User.aggregate([
//   {
//     $match: {
//       experience: { $gte: 3 },
//       skills: { $all: ["React", "Nodejs"] },
//     },
//   },
// ]);

// User.aggregate([
//   {
//     $match: {
//       likes: { $gt: 50 },
//       $or: [
//         { title: { $regex: "MongoDB", $options: "i" } },
//         { tags: { $in: ["DataBase"] } },
//       ],
//       createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
//     },
//   },
// ]);

// User.aggregate([
//   {
//     $match: {
//       total: { $gt: 500 },
//       "customer.address.state": "CA",
//       $expr: { $gte: [{ $size: "$items" }, 3] },
//     },
//   },
// ]);

// Student.aggregate([
//   {
//     $group: {
//       id: "$customerId",
//       totalSum: { $sum: "$quantity" },
//     },
//   },
// ]);

// Student.aggregate([
//   {
//     $group: {
//       _id: "$region",
//       totalAmount: { $sum: "$amount" },
//       totalSales: { $sum: 1 },
//       averageAmount: { $avg: "$amount" },
//     },
//   },
// ]);

// Student.aggregate([
//   {
//     $group: {
//       _id: {
//         customer: "$customer",
//         month: "$month",
//       },
//       totalAmount: { $sum: "$amount" },
//       totalQuantity: { $sum: 1 },
//       differentProducts: { $sum: 1 },
//     },
//   },
// ]);

// Users.aggregate([
//   {
//     $group: {
//       _id: "$age",
//       noOfUsers: { $sum: 1 },
//     },
//   },
// ]);

// Users.aggregate([
//   {
//     $group: {
//       _id: "$department",
//       total: { $avg: "$salary" },
//     },
//   },
// ]);

// Users.aggregate([
//   {
//     $group: {
//       _id: "$user",
//       uniqueHobbies: { $addToSet: "$hobbies" },
//     },
//   },
// ]);

// Orders.aggregate([
//   {
//     $lookup: {
//       from: "users",
//       localField: "userId",
//       foreignField: "_id",
//       as: "userInfo",
//     },
//   },
// ]);
