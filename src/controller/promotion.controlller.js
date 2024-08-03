import { EMessage } from "../service/enum.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import shortid from "shortid";
import prisma from "../util/Prisma.js";
import redis from "../Database/radis.js";
import { DataExist, ValidatePromotion } from "../service/validate.js";
import { FindPromotionId } from "../service/find.js";

let cacheKey = "promotions";
let model = "promotion";

const PromotionController = {
  async Insert(req, res) {
    try {
      const validate = ValidatePromotion(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }

      let { qty, start_time, end_time } = req.body;
      if (typeof qty !== "number") {
        qty = parseInt(qty, 10);
      }

      const code = shortid.generate().toLocaleUpperCase();
      const promotion = await prisma.promotion.create({
        data: {
          qty,
          code,
          start_time,
          end_time,
        },
      });
      await CacheAndInsertData(cacheKey, model, promotion);
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
      const promotionExists = await FindPromotionId(id);
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
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.updateSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} promotion`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const promotionExists = await FindPaymentBy(id);
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
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.deleteSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} promotion`, error);
    }
  },
  async SelAll(req, res) {
    try {
      let promotion = await CacheAndRetrieveUpdatedData(cacheKey, model);
      SendSuccess(res, `${EMessage.fetchAllSuccess}`, promotion);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} promotion`, error);
    }
  },
  async SelOne(req, res) {
    try {
      const id = req.params.id;
      let promotion = await FindPromotionId(id);
      if (!promotion) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} promotion with id:${id}`
        );
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
