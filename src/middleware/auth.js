import jwt from "jsonwebtoken";
import {
  CacheAndInsertDataUser,
  CacheAndRetrieveUpdatedDataUser,
  SendError,
  VerifyToken,
} from "../service/service.js";
import { EMessage } from "../service/enum.js";
import prisma from "../util/prismaClient.js";


export const auth = async (req, res, next) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) return SendError(res, 401, EMessage.invalidToken);

    const token = authorization.replace("Bearer ", "").trim();
    if (!token) return SendError(res, 401, EMessage.notFound + " Token");
    const decode = await VerifyToken(token);

    req.user = decode;
    next();
  } catch (err) {
    if (err.message == "Token has expired") {
      return SendError(res, 401, EMessage.tokenExpired);
    }
    return SendError(res, 401, err.message || "Unauthorized");
  }
};
export const admin = async (req, res, next) => {
  try {
    const id = req.user;

    if (!id) return SendError(res, 401, "You are not allowed id");
    const data = await CacheAndRetrieveUpdatedDataUser("users", "user");
    const user = data.find(
      (user) =>
        user.id === id && (user.role === "admin" || user.role === "supperadmin")
    );

    if (!user) return SendError(res, 401, "You are not allowed ");
    next();
  } catch (err) {
    return SendError(res, 401, EMessage.serverError, err.message);
  }
};
