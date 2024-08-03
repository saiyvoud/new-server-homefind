import redis from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import {
  FindPromotionId,
  FindUserById,
  FindWalletById,
} from "../service/find.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { DataExist, ValidateWallet } from "../service/validate.js";
import prisma from "../util/Prisma.js";
const cacheKey = "wallets";
const model = "wallet";
const WalletController = {
  async Insert(req, res) {
    try {
      const validate = ValidateWallet(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }
      const { userId, promotionId } = req.body;
      const [userExists, promotionExists] = await Promise.all([
        FindUserById(userId),
        FindPromotionId(promotionId),
      ]);
      if (!userExists) {
        return SendError(res, 404, `${EMessage.notFound} user with id:${id}`);
      }
      if (!promotionExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} promotion with id:${id}`
        );
      }
      const wallet = await prisma.wallet.create({
        data: {
          userId,
          promotionId,
        },
      });
      await CacheAndInsertData(cacheKey, model, wallet);
      SendCreate(res, `${EMessage.insertSuccess} wallet`, wallet);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} wallet`, error);
    }
  },
  async Update(req, res) {
    try {
      const { id } = req.params;
      const data = DataExist(req.body);
      const promises = [FindWalletById(id)];

      if (data.userId) promises.push(FindUserById(data.userId));
      if (data.promotionId) promises.push(FindPromotionId(data.promotionId));
      if (data.status && typeof data.status !== "boolean") {
        data.status = data.status === "true";
      }
      const [walletExists, userExists, promotionExists] = await Promise.all(
        promises
      );

      if (
        !walletExists ||
        (data.userId && !userExists) ||
        (data.promotionId && !promotionExists)
      ) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            !walletExists ? "wallet" : data.userId ? "user" : "promotion"
          } with id: ${id || data.userId || data.promotionId}`
        );
      }

      const wallet = await prisma.wallet.update({ where: { id }, data });
      await redis.del(cacheKey);

      SendSuccess(res, `${EMessage.updateSuccess}`, wallet);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} wallet`, error);
    }
  },
  async Delete(req, res) {
    try {
      const { id } = req.params;
      const walletExists = await FindWalletById(id);
      if (!walletExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} wallet with id: ${id}`
        );
      }
      const wallet = await prisma.wallet.update({
        where: { id },
        data: { isActive: false },
      });
      SendSuccess(res, `${EMessage.deleteSuccess}`, wallet);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} wallet`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const wallet = await CacheAndRetrieveUpdatedData(cacheKey, model);
      SendSuccess(res, `${EMessage.fetchAllSuccess}`, wallet);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} wallet`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const wallet = await FindWalletById(id);
      if (!wallet) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} wallet with id: ${id}`
        );
      }
      SendSuccess(res, `${EMessage.fetchOneSuccess}`, wallet);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} wallet`, error);
    }
  },
  async SelectByUserId(req, res) {
    try {
      const userId = req.body;
      const wallet = await prisma.wallet.findMany({
        where: { userId, isActive: true, status: true },
        orderBy: { createAt: "desc" },
      });
      if (!wallet) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} wallet with userId: ${id}`
        );
      }
      SendSuccess(res, `${EMessage.fetchOneSuccess}`, wallet);
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.fetchAllSuccess} wallet by userId`,
        error
      );
    }
  },
};
export default WalletController;
