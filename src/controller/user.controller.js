import { EMessage } from "../service/enum.js";
import {
  ExistingUser,
  FindUserById,
  FindUserByIdShowPassword,
  FindUserByPhoneNumber,
} from "../service/find.js";
import {
  CacheAndInsertDataUser,
  CacheAndRetrieveUpdatedDataUser,
  Decrypt,
  Endcrypt,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
  VerifyRefreshToken,
} from "../service/service.js";
import {
  DataExist,
  VaildateForgotPassword,
  ValidateChangePassword,
  ValidateLogin,
  ValidateLoginEmail,
  ValidateUser,
} from "../service/validate.js";
import prisma from "../util/Prisma.js";
import redis from "../Database/radis.js";
import { generateJWTtoken } from "../config/GenerateToken.js";
import { KLimit, SECRET_KEY } from "../config/api.config.js";
import CryptoJS from "crypto-js";
import { UploadImage } from "../service/uploadImage.js";
const cacheKey = "users";
const model = "user";
export const UserControlller = {
  async Registor(req, res) {
    try {
      // Validate user input
      const validate = ValidateUser(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }

      // Check for existing user
      const existingUser = await ExistingUser(req.body);
      const { username, email, password, phoneNumber } = req.body;

      if (existingUser) {
        if (existingUser.username === username) {
          return SendError(
            res,
            400,
            `${EMessage.userAlreadyExists} with username :${username}`
          );
        }
        if (existingUser.phoneNumber === phoneNumber) {
          return SendError(
            res,
            400,
            `${EMessage.userAlreadyExists} with phoneNumber :${phoneNumber}`
          );
        }
        if (existingUser.email === email) {
          return SendError(
            res,
            400,
            `${EMessage.userAlreadyExists} with email :${email}`
          );
        }
      }

      // Encrypt password and create user
      const hashPassword = await Endcrypt(password);
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashPassword,
          phoneNumber,
        },
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });

      // Generate JWT token
      const encrypId = await Endcrypt(user.id);
      const dataJWT = {
        id: encrypId,
        loginversion: user.loginversion,
      };
      const token = await generateJWTtoken(dataJWT);
      const result = { ...user, token };

      await CacheAndInsertDataUser(cacheKey, user);

      // Send response
      return SendCreate(res, `${EMessage.registrationSuccess}`, result);
    } catch (err) {
      SendErrorCatch(res, `${EMessage.registrationFailed}`, err);
    }
  },

  async RefreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput} refreshToken is required`
        );

      const result = await VerifyRefreshToken(refreshToken);
      if (!result) return SendError(res, "Error Generating refresh token");
      return SendSuccess(res, `${EMessage.refreshTokenSuccess}`, result);
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.refreshTokenunSuccess} user `,
        error
      );
    }
  },
  async SelectAll(req, res) {
    try {
      const user = await CacheAndRetrieveUpdatedDataUser(cacheKey, model);
      return SendSuccess(res, `${EMessage.fetchAllSuccess} user`, user);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingAll} user`, error);
    }
  },

  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const user = await FindUserById(id);
      if (!user)
        return SendError(res, 404, `${EMessage.notFound} user with id :${id}`);
      return SendSuccess(res, `${EMessage.fetchOneSuccess} user`, user);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingOne} user`, error);
    }
  },
  async Login(req, res) {
    try {
      const validate = ValidateLogin(req.body);
      if (validate.length > 0)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      const { username, password } = req.body;
      const user = await prisma.user.findFirst({
        where: { username, isActive: true },
      });
      if (!user)
        return SendError(
          res,
          404,
          EMessage.notFound + ` user with username: ${username}`
        );
      let passDecript = await Decrypt(user.password, SECRET_KEY);
      let decryptedPass = passDecript.toString(CryptoJS.enc.Utf8);
      decryptedPass = decryptedPass.replace(/"/g, "");
      if (decryptedPass !== password)
        return SendError(res, 400, "Password is not match");
      const updateUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: { loginversion: user.loginversion + 1 },
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });

      const encrypId = await Endcrypt(user.id);
      const dataJWT = {
        id: encrypId,
        loginversion: user.loginversion,
      };
      const token = await generateJWTtoken(dataJWT);
      const result = Object.assign(
        JSON.parse(JSON.stringify(updateUser)),
        JSON.parse(JSON.stringify(token))
      );
      // await redis.del(cacheKey);
      return SendCreate(res, `${EMessage.loginSuccess}`, result);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.loginfall} user `, error);
    }
  },
  async LoginEmail(req, res) {
    try {
      const validate = ValidateLoginEmail(req.body);
      if (validate.length > 0)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      const { email, password } = req.body;
      const user = await prisma.user.findFirst({
        where: { email, isActive: true },
      });
      if (!user)
        return SendError(
          res,
          404,
          EMessage.notFound + ` user with email: ${email}`
        );
      let passDecript = await Decrypt(user.password, SECRET_KEY);
      let decryptedPass = passDecript.toString(CryptoJS.enc.Utf8);
      decryptedPass = decryptedPass.replace(/"/g, "");
      if (decryptedPass !== password)
        return SendError(res, 400, "Password is not match");
      const updateUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: { loginversion: user.loginversion + 1 },
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });

      const encrypId = await Endcrypt(user.id);
      const dataJWT = {
        id: encrypId,
        loginversion: user.loginversion,
      };
      const token = await generateJWTtoken(dataJWT);
      const result = Object.assign(
        JSON.parse(JSON.stringify(updateUser)),
        JSON.parse(JSON.stringify(token))
      );
      // await redis.del(cacheKey);
      return SendCreate(res, `${EMessage.loginSuccess}`, result);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.loginfall} user `, error);
    }
  },
  async ChangePassword(req, res) {
    try {
      const { id } = req.params;
      const validate = ValidateChangePassword(req.body);
      if (validate.length > 0) {
        return SendError(res, 400, "Please input:" + validate.join(","));
      }
      const { oldPassword, newPassword } = req.body;
      const userExists = await FindUserByIdShowPassword(id);
      if (!userExists)
        return SendError(res, 404, `${EMessage.notFound} user with ID ${id}`);
      let passDecript = await Decrypt(
        userExists.password.toString(),
        SECRET_KEY
      );
      let decriptPass = passDecript.toString(CryptoJS.enc.Utf8);
      decriptPass = decriptPass.replace(/"/g, "");
      if (oldPassword !== decriptPass)
        return SendError(res, 400, "Password does not match");
      const hashPassword = await Endcrypt(newPassword);
      const user = await prisma.user.update({
        where: {
          id,
        },
        data: {
          password: hashPassword,
          loginversion: userExists.loginversion + 1,
        },
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });
      // await redis.del(cacheKey);
      return SendSuccess(res, EMessage.updateSuccess, user);
    } catch (error) {
      return SendErrorCatch(res, `Change password fail`, error);
    }
  },
  async ForgotPassword(req, res) {
    try {
      const validate = VaildateForgotPassword(req.body);
      if (validate.length > 0) {
        return SendError(res, 400, "Please input:" + validate.join(","));
      }
      const { phoneNumber, newPassword } = req.body;
      const userExists = await FindUserByPhoneNumber(phoneNumber);
      if (!userExists)
        return SendError(
          res,
          404,
          `${EMessage.notFound} user with phone number: ${phoneNumber}`
        );
      const hasPassword = await Endcrypt(newPassword);
      const user = await prisma.user.update({
        where: { id: userExists.id },
        data: {
          data: { password: hasPassword },
        },
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });
      // await redis.del(cacheKey);
      return SendSuccess(res, EMessage.updateSuccess, user);
    } catch (error) {
      return SendErrorCatch(res, `Forgot password fail`, error);
    }
  },
  async Update(req, res) {
    try {
      const { id } = req.params;
      const data = DataExist(req.body);
      if (!data) return SendError(res, 400, EMessage.pleaseInput + " data");
      if (data.password) {
        data.password = await Endcrypt(data.password);
      }
      const userExists = await FindUserById(id);
      if (!userExists)
        return SendError(res, 404, `${EMessage.notFound} user with ID ${id}`);

      const existingUser = await ExistingUser(req.body);

      if (existingUser) {
        if (existingUser.username === data.username) {
          return SendError(
            res,
            404,
            `${EMessage.userAlreadyExists} with username :${data.username}`
          );
        }
        if (existingUser.phoneNumber === data.phoneNumber) {
          return SendError(
            res,
            404,
            `${EMessage.userAlreadyExists} with phoneNumber :${data.phoneNumber}`
          );
        }
        if (existingUser.email === data.email) {
          return SendError(
            res,
            404,
            `${EMessage.userAlreadyExists} with email :${data.email}`
          );
        }
      }
      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedDataUser(cacheKey, model)
      return SendSuccess(res, EMessage.updateSuccess, user);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.updateFailed} user `, error);
    }
  },

  async UpdateKYCStatus(req, res) {
    try {
      const id = req.params.id;
      let { status } = req.body;
      if (!status)
        return SendError(res, 400, `${EMessage.pleaseInput} : status`);
      if (typeof status !== "boolean") {
        status = status == "true" ? true : false;
      }
      const userExists = await FindUserById(id);
      if (!userExists) {
        return SendError(res, 404, `${EMessage.deleteFailed}`);
      }
      const user = await prisma.user.update({
        where: {
          id,
        },
        data: {
          kyc: status,
        },
      });
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedDataUser(cacheKey, model)
      SendSuccess(res, `${EMessage.updateSuccess} user with id ${user.id}`);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} User KYC status`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const userExists = await FindUserById(id);
      if (!userExists) {
        return SendError(res, 404, `${EMessage.notFound} with id ${id}`);
      }
      const user = await prisma.user.update({
        where: {
          id,
        },
        data: { isActive: false },
      });
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedDataUser(cacheKey, model)
      return SendSuccess(
        res,
        `${EMessage.deleteSuccess} user with id ${user.id}`
      );
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.updateFailed} user `, error);
    }
  },
  async SelecAllPage(req, res) {
    try {
      const page = parseInt(req.query.page, 10);
      const skip = page && page > 0 ? page - 1 : 0;
      let cachKey = "userPage" + page;
      //   await redis.del(cachKey);

      const cachedData = await redis.get(cachKey);
      if (cachedData) {
        return SendSuccess(
          res,
          `${EMessage.fetchAllSuccess} page`,
          JSON.parse(cachedData)
        );
      }

      const user = await prisma.user.findMany({
        skip: skip * KLimit,
        where: { isActive: true, role: "user" },
        orderBy: { createAt: "desc" },
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });
      const count = await prisma.user.count({
        where: { isActive: true, role: "user" },
      });
      const result = {
        count,
        user,
      };
      redis.set(cachKey, JSON.stringify(result), "EX", 3600);
      return SendSuccess(res, `${EMessage.fetchAllSuccess} page`, result);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.fetchAllSuccess} user `, error);
    }
  },
  async UpdateImage(req, res) {
    try {
      const id = req.params.id;
      const { oldImage } = req.body;
      if (!oldImage) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldImage`);
      }
      const data = req.files;
      if (!data) {
        return SendError(res, 400, `${EMessage.pleaseInput}: image `);
      }
      const userExists = await FindUserById(id);
      if (!userExists) {
        return SendError(res, 404, `${EMessage.notFound} user with id ${id}`);
      }
      const imgUrl = await UploadImage(data.image.data);
      const user = await prisma.user.update({
        where: { id },
        data: {
          profile: imgUrl,
        },
        select: {
          id: true,
          isActive: true,
          username: true,
          email: true,
          phoneNumber: true,
          profile: true,
          kyc: true,
          role: true,
          createAt: true,
          updateAt: true,
        },
      });
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedDataUser(cacheKey, model)
      SendSuccess(res, `${EMessage.updateSuccess}`, user);
    } catch (error) {
      console.error("Error updating image:", error);
      return SendErrorCatch(res, `${EMessage.updateFailed} image`, error);
    }
  },
};

export default UserControlller;
