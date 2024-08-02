import { EMessage } from "../service/enum.js";
import {
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import shortid from "shortid";
import prisma from "../util/Prisma.js";
import redis from "../Database/radis.js";
import { DataExist } from "../service/validate.js";
import { FindPromotion } from "../service/find.js";

let cacheKey = "promotion";
const PromotionController = {
  async Insert(req, res) {
    try {
      let qty = req.body.qty;

      if (!qty) {
        SendError(res, 400, `${EMessage.pleaseInput}: qty is not a number`);
      }
      if (typeof qty !== "number") {
        qty = parseInt(qty, 10);
      }

      const code = shortid.generate().toLocaleUpperCase();
      const promotion = await prisma.promotion.create({
        data: {
          qty,
          code,
        },
      });
      const cachedData = await redis.get(cacheKey);
      if (!cachedData) {
        const promo = await prisma.promotion.findMany({
          where: { isActive: true },
          orderBy: {
            createAt: "desc",
          },
        });
        await redis.set(cacheKey, JSON.stringify(promo), "EX", 3600);
      } else {
        const promo = JSON.parse(cachedData);
        promo.unshift(promotion);
        await redis.set(cacheKey, JSON.stringify(promo), "EX", 3600);
      }
      SendCreate(res, `${EMessage.insertSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} promotion`, error);
    }
  },

  async Update(req, res) {
    try {
      const id = req.params.id;
      let data = DataExist(req.body);
      if (typeof data.qty !== "number") {
        data.qty = parseInt(data.qty, 10);
      }
      const promotionExists = await FindPromotion(id);
      if (!promotionExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} promotion with id:${id}`
        );
      }
      const promotion = await prisma.promotion.update({
        where: { id },
        data,
      });
      await redis.del(cacheKey, cacheKey + id);
      SendSuccess(res, `${EMessage.updateSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} promotion`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const promotionExists = await FindPromotion(id);
      if (!promotionExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} promotion with id:${id}`
        );
      }
      const promotion = await prisma.promotion.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await redis.del(cacheKey, cacheKey + id);
      SendSuccess(res, `${EMessage.deleteSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} promotion`, error);
    }
  },
  async SelAll(req, res) {
    try {
      let promotion;
      const cachedData = await redis.get(cacheKey);
      if (!cachedData) {
        promotion = await prisma.promotion.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            createAt: "desc",
          },
        });
        await redis.set(cacheKey, JSON.stringify(promotion), "EX", 3600);
      } else {
        promotion = JSON.parse(cachedData);
      }
      SendSuccess(res, `${EMessage.fetchAllSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} promotion`, error);
    }
  },
  async SelOne(req, res) {
    try {
      let promotion;

      const id = req.params.id;
      const cachedData = await redis.get(cacheKey + id);
      if (!cachedData) {
        promotion = await prisma.promotion.findUnique({
          where: {
            isActive: true,
            id,
          },
        });
        if (!promotion)
          return SendError(
            res,
            404,
            `${EMessage.notFound} promotion with id ${id}`
          );
        await redis.set(cacheKey + id, JSON.stringify(promotion), "Ex", 3600);
      } else {
        promotion = JSON.parse(cachedData);
      }
      SendSuccess(res, `${EMessage.fetchOneSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} promotion`, error);
    }
  },
  async SelectByCode(req, res) {
    try {
     // await redis.del(cacheKey);
      const code = req.params.code;
      const cachedData = await redis.get(cacheKey);
      let promotion;
      if (!cachedData) {
        promotion = await prisma.promotion.findFirst({
          where: {
            code,
            isActive: true,
          },
        });
      } else {
        const dataList = JSON.parse(cachedData);
        promotion = dataList.find((pro) => pro.code == code);
      }
      if (!promotion) {
        SendError(res, 404, `${EMessage.notFound} promotion with code ${code}`);
        return;
      }
      SendSuccess(res, `Select code promotion`, promotion);
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingOne}  status by code`,
        error
      );
    }
  },
};

export default PromotionController;
