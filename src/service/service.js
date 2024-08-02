import CryptoJS from "crypto-js";
import { SECRET_KEY } from "../config/api.config.js";
import jwt from "jsonwebtoken";
import prisma from "../util/Prisma.js";
import { generateJWTtoken } from "../config/GenerateToken.js";

export const SendSuccess = (res, message, data) => {
  res.status(200).json({ status: true, message, data });
};
export const SendError = (res, status, message, err) => {
  res.status(status).json({ status: false, message, data: {}, err });
};

export const SendCreate = (res, message, data) => {
  res.status(201).json({ status: true, message, data });
};

export const SendErrorCatch = (res, message, error) => {
  console.log(`Error:${message}`, error);
  res.status(500).json({ status: false, message, error });
};

export const Decrypt = (hash) => {
  return new Promise(async (resolve, reject) => {
    try {
      const decoded = CryptoJS.AES.decrypt(hash, SECRET_KEY).toString(
        CryptoJS.enc.Utf8
      );
      resolve(decoded);
    } catch (error) {
      reject(error);
    }
  });
};

export const Endcrypt = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const hash = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        SECRET_KEY
      ).toString();

      resolve(hash);
    } catch (error) {
      reject(error);
    }
  });
};
export const VerifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          console.error("JWT Verification Error: Token has expired");
          return reject(new Error("Token has expired"));
        } else {
          console.error("JWT Verification Error:", err.message);
          return reject(new Error("Invalid token"));
        }
      }

      try {
        const id = await Decrypt(decoded.id);

        if (!id) {
          console.error("Decryption Error: Decrypted ID is empty or invalid");
          return reject(
            new Error(
              "Error verifying authorization: Decrypted ID is empty or invalid"
            )
          );
        }
        let decryptedPass = id.toString(CryptoJS.enc.Utf8);
        decryptedPass = decryptedPass.replace(/"/g, "");

        const user = await prisma.user.findUnique({
          where: { id: decryptedPass, isActive: true },
        });

        if (!user) {
          console.error("Authorization Error: User not found");
          return reject(new Error("Invalid authorization: User not found"));
        }

        return resolve(user.id);
      } catch (error) {
        console.error("Decryption or Database Error:", error.message);
        return reject(
          new Error("Error decrypting token or fetching user data")
        );
      }
    });
  });
};

export const VerifyRefreshToken = (data) => {
  return new Promise((resolve, reject) => {
    jwt.verify(data, SECRET_KEY, async (err, decode) => {
      try {
        if (err) return reject(err);
        const refreshDecrip = await Decrypt(decode.id, SECRET_KEY);
        if (!refreshDecrip) return reject("Error Verify Authorization");
        const id = await Decrypt(refreshDecrip, SECRET_KEY);
        if (!id) {
          return reject("Error RefreshToken");
        }
        let decryptedPass = id.toString(CryptoJS.enc.Utf8);
        decryptedPass = decryptedPass.replace(/"/g, "");

        const user = await prisma.user.findUnique({
          where: { id: decryptedPass },
        });
        if (!user) return reject("Error Verify Authorization");
        const update = await prisma.user.update({
          where: { id },
          data: {
            loginversion: loginversion + 1,
          },
        });
        const encrypId = await Endcrypt(user.id, SECRET_KEY);
        const dataJWT = {
          id: encrypId,
          loginversion: update.loginversion,
        };
        const token = await generateJWTtoken(dataJWT);
        resolve(token);
      } catch (error) {
        console.error("General Error:", error);

        return reject(error);
      }
    });
  });
};
