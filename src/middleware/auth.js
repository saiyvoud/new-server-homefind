import jwt from "jsonwebtoken";
import { SendError } from "../service/service.js";
import { EMessage } from "../service/enum.js";
import { prisma } from "../util/prisma.js";

export const auth = async (req, res, next) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) SendError(res, 401, EMessage.invalidToken);

    const token = authorization.split("Bearer", " ").trim();
    if (!token) SendError(res, 401, EMessage.tokenNotFound);
    const decode = await verifyToken(token);

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
    const id = req.user.id;
    if (!id) SendError(res, 401, "You are not allowed id");
    const user = await prisma.user.findUnique({
      where: {
        id: id,
        isActive: true,
        OR: [{ role: "admin" }, { role: "supperadmin" }],
      },
    });

    if (!user) SendError(res, 404, "You are not allowed ");
  } catch (err) {
    return SendError(res, 401, EMessage.serverError, err.message);
  }
};
