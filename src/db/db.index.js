import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}`
    );
    console.log(
      `mongodbConnected on db Host:${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("connection to mongodb failed:", error);
    process.exit(1);
  }
};
export default connectDb;
