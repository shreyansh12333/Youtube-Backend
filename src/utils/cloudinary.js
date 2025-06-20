import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file has been uploaded on cloudinary", response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (url, resourceType = "auto") => {
  try {
    if (!url || typeof url !== "string") {
      return null;
    }

    const cleanUrl = url.split("?")[0];
    const uploadIndex = cleanUrl.indexOf("/upload/");

    if (uploadIndex === -1) {
      return null;
    }

    const pathAfterUpload = cleanUrl.substring(uploadIndex + 8);
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
    const lastDotIndex = pathWithoutVersion.lastIndexOf(".");
    const publicId =
      lastDotIndex === -1
        ? pathWithoutVersion
        : pathWithoutVersion.substring(0, lastDotIndex);

    const result = await cloudinary.uploader.destroy(
      decodeURIComponent(publicId),
      {
        resource_type: resourceType,
        invalidate: true,
      }
    );

    return result.result === "ok" ? result : null;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
