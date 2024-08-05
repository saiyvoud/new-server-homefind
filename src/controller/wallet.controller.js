import client from "../Database/radis.js";
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
import prisma from "../util/prismaClient.js";
let cacheKey = "wallets";
const model = "wallet";
let select = {
  id: true,
  userId: true,
  promotionId: true,
  createAt: true,
  updateAt: true,
  status: true,
  promotion: {
    select: {
      qty: true,
      code: true,
      isGiven: true,
    },
  },
};
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
        select,
      });
      await client.del(cacheKey + walletExists.userId);
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

      // Initialize promises with the wallet check
      const promises = [FindWalletById(id)];

      // Add related entity checks if they exist in data
      if (data.userId) promises.push(FindUserById(data.userId));
      if (data.promotionId) promises.push(FindPromotionId(data.promotionId));

      // Convert status to boolean if it's provided and not already a boolean
      if (data.status && typeof data.status !== "boolean") {
        data.status = data.status === "true";
      }

      // Resolve all promises
      const [walletExists, userExists, promotionExists] = await Promise.all(
        promises
      );

      // Check if wallet exists and if related entities exist
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
          } with id: ${
            !walletExists ? id : data.userId ? data.userId : data.promotionId
          }`
        );
      }

      // Update the wallet
      const wallet = await prisma.wallet.update({
        where: { id },
        data,
      });

      // Clear the cache
      await client.del(cacheKey, cacheKey + walletExists.userId);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);

      // Send success response
      SendSuccess(res, `${EMessage.updateSuccess}`, wallet);
    } catch (error) {
      // Handle errors
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
      await client.del(cacheKey, cacheKey + walletExists.userId);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
      SendSuccess(res, `${EMessage.deleteSuccess}`, wallet);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} wallet`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const wallet = await CacheAndRetrieveUpdatedData(cacheKey, model, select);
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
      const wallet = await CacheAndRetrieveUpdatedData(
        cacheKey + userId,
        model,
        select
      );
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
