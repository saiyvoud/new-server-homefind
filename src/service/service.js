import CryptoJS from "crypto-js";
import { SECRET_KEY } from "../config/api.config.js";
import jwt from "jsonwebtoken";
import prisma from "../util/prismaClient.js";
import { generateJWTtoken } from "../config/GenerateToken.js";
import client from "../Database/radis.js";
import { FindUserById, FindUserByIdShowPassword } from "./find.js";

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

export const CheckUniqueElement = (a, b) => {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    if (!b.includes(a[i])) {
      result.push(a[i]);
    }
  }
  return result;
};

// export const CacheAndInsertDataUser = async (cacheKey, newData) => {
//   try {
//     // Cache the new user data

//     const cachedData = await client.get(cacheKey);

//     if (cachedData) {
//       // If cache exists, update it with the new user
//       const users = JSON.parse(cachedData);
//       users.unshift(newData);
//       await client.set(cacheKey, JSON.stringify(users), "EX", 3600); // Cache for 1 hour
//     } else {
//       // If no cache, fetch all active users from database and cache them
//       const users = await prisma.user.findMany({
//         where: { isActive: true },
//         orderBy: { createAt: "desc" },
//         select: {
//           id: true,
//           isActive: true,
//           username: true,
//           email: true,
//           phoneNumber: true,
//           profile: true,
//           kyc: true,
//           role: true,
//           createAt: true,
//           updateAt: true,
//         },
//       });
//       await client.set(cacheKey, JSON.stringify(users), "EX", 3600); // Cache for 1 hour
//     }
//   } catch (error) {
//     console.error(`Failed to cache and insert data for ${model}:`, error);
//     throw error;
//   }
// };

export const CacheAndInsertData = async (
  cacheKey,
  model,
  where,
  newData,
  select
) => {
  try {
    const cachedData = await client.get(cacheKey);
    let data;
    if (!cachedData) {
      data = await prisma[model].findMany({
        where,
        orderBy: { createAt: "desc" },
        select,
      });

      await client.set(cacheKey, JSON.stringify(data), "EX", 3600);
    } else {
      data = JSON.parse(cachedData);
      data.unshift(newData);

      await client.set(cacheKey, JSON.stringify(data), "EX", 3600);
    }
  } catch (error) {
    console.error(`Failed to cache and insert data for ${model}:`, error);
    throw error;
  }
};

export const CacheAndRetrieveUpdatedData = async (
  cacheKey,
  model,
  where,
  select
) => {
  try {
    //const cachedData = await client.get(cacheKey);
    let data;
    // if (!cachedData) {
    console.log("pomostion");
    console.log(
      `Cache Key: ${cacheKey}, Model: ${model}, Where: ${JSON.stringify(
        where
      )}, Select: ${JSON.stringify(select)}`
    );
    if (true) {
      data = await prisma[model].findMany({
        where,
        select,
        orderBy: { createAt: "desc" },
      });

      await client.set(cacheKey, JSON.stringify(data), "EX", 3600);
    } else {
      data = JSON.parse(cachedData);
    }
    //  console.log('data :>> ', data);

    return data;
  } catch (error) {
    console.error(`Failed to retrieve updated data for ${model}:`, error);
    throw error;
  }
};

// export const CacheAndRetrieveUpdatedDataUser = async (cacheKey, model) => {
//   try {
//     const cachedData = await client.get(cacheKey);
//     let data;

//     if (!cachedData) {
//       data = await prisma.user.findMany({
//         where: { isActive: true },
//         orderBy: { createAt: "desc" },
//         select: {
//           id: true,
//           isActive: true,
//           username: true,
//           email: true,
//           phoneNumber: true,
//           profile: true,
//           kyc: true,
//           role: true,
//           createAt: true,
//           updateAt: true,
//         },
//       });

//       await client.set(cacheKey, JSON.stringify(data), "EX", 3600);
//     } else {
//       data = JSON.parse(cachedData);
//     }

//     return data;
//   } catch (error) {
//     console.error(`Failed to retrieve updated data for ${model}:`, error);
//     throw error;
//   }
// };
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

        const user = await FindUserById(decryptedPass);

        if (!user) {
          console.error("Authorization Error: User not found");
          return reject(new Error("Invalid authorization: User not found"));
        }

        return resolve({ id: user.id, role: user.role });
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
        const refreshDecrip = await Decrypt(decode.id);
        let decropRefresh = refreshDecrip.toString(CryptoJS.enc.Utf8);
        decropRefresh = decropRefresh.replace(/"/g, "");
        if (!decropRefresh) return reject("Error Verify Authorizationsdfasdf");
        const id = await Decrypt(decropRefresh);
        console.log("id :>> ", id);
        if (!id) {
          return reject("Error RefreshToken");
        }
        let decryptedPass = id.toString(CryptoJS.enc.Utf8);
        decryptedPass = decryptedPass.replace(/"/g, "");

        const user = await FindUserById(decryptedPass);
        console.log("user :>> ", user);
        if (!user) return reject("Error Verify Authorization");
        const [update, encrypId] = await Promise.all([
          prisma.user.update({
            where: { id: user.id },
            data: { loginversion: (user?.loginversion || 0) + 1 },
          }),
          Endcrypt(user.id, SECRET_KEY),
        ]);

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
