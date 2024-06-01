import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${process.env.DB_NAME}`
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
