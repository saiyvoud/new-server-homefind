import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { JWT_REFRECH_TIMEOUT, JWT_TIMEOUT, SECRET_KEY } from "./api.config";

export const generateJWTtoken = async (data) => {
  try {
    const payload = {
      id: data.id,
      loginversion: data.loginversion,
    };
    const encryptId = bcryptjs.hash(JSON.stringify(payload.id), SECRET_KEY);
    const jwtData = {
      expiresIn: String(JWT_TIMEOUT),
    };
    const jwtRefreshData = {
      expiresIn: String(JWT_REFRECH_TIMEOUT),
    };
    const payloodRefresh = {
      id: encryptId,
      loginversion: data.loginversion,
    };
    const token = jwt.sign(payload, SECRET_KEY, jwtData);
    const refreshToken = jwt.sign(payloodRefresh, SECRET_KEY, jwtRefreshData);
    const resultData = {
      token: token,
      refreshToken: refreshToken,
    };
    return resultData;
  } catch (error) {
    console.log("error generate token :>> ", error);
    return false;
  }
};
