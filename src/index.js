import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDb from "./db/db.index.js";
import dotenv from "dotenv";
dotenv.config({
  path: "../.env",
});

// import express from "express";

// const app = express();
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERRR: ", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`server running on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("connection to mongodb failed", error);
//     throw error;
//   }

// })();

connectDb();
