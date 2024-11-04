import jwt from "jsonwebtoken";
import { JWT_REFRECH_TIMEOUT, JWT_TIMEOUT, SECRET_KEY } from "./api.config.js";

export const generateJWTtoken = async (data) => {
  try {
    const payload = {
      id: data.id,
      loginversion: data.loginversion,
    };

    const encryptId = data.id;
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
    const expiresIn = jwt.verify(token, SECRET_KEY);
    const resultData = {
      token: token,
      refreshToken: refreshToken,
      expiresIn: expiresIn.exp,
    };
    console.log('resultData :>> ', expiresIn);
    return resultData;
  } catch (error) {
    console.log("error generate token :>> ", error);
    return false;
  }
};
