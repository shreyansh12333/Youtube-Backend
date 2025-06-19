import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDb from "./db/db.index.js";
import dotenv, { configDotenv } from "dotenv";
dotenv.config({
  path: "../.env",
});

configDotenv();
import { app } from "./app.js";
connectDb()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`server listening on ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("mongodb connection failed !!!", error);
  });
