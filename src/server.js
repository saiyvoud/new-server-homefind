import express from "express";
import morgan from "morgan";
import cors from "cors";
import fileUpload from "express-fileupload";
import { EAPI, SERVER_PORT } from "./config/api.config.js";
import prisma from "../src/util/prismaClient.js";

import APIRouter from "./router/index.router.js";
import client from "./Database/radis.js";

// Redis event listeners

const app = express();

// Middleware
app.use(express.json({ limit: "500mb" }));
app.use(
  express.urlencoded({ extended: false, limit: "500mb", parameterLimit: 500 })
);
app.use(fileUpload());
app.use(morgan("dev"));

// CORS Headers
// app.all("/*", (req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Accept, Access-Token, X-Requested-With"
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   next();
// });

app.use(
  cors({
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Access-Token",
      "Accept",
    ],
  })
);
// API Router
app.use(EAPI, APIRouter);

// Check Database Connection
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log("Prisma Connected to the DATABASE Success: OK");
  } catch (err) {
    console.error("Error Connecting to DATABASE Fail:", err);
    setTimeout(async () => {
      console.log("Reconnecting to Database....");
      await checkDatabaseConnection();
    }, 10000);
  }
};

// await client.del("orders");


// const user = await redis.get("users");
// console.log('user :>> ', user);
// Start Server

app.listen(SERVER_PORT, async () => {
  console.log(`Server is listening on http://localhost:${SERVER_PORT}`);
  console.log(`Server Already: ${SERVER_PORT}`);
  checkDatabaseConnection();
});
