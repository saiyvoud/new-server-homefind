import redis from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import { FindStatusById } from "../service/find.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { DataExist, ValidateStatus } from "../service/validate.js";
import prisma from "../util/prismaClient.js";

const cacheKey = "status";
const model = "status";
const StatusController = {
  async Insert(req, res) {
    try {
      const validate = ValidateStatus(req.body);
      const { name } = req.body;

      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }

      const status = await prisma.status.create({
        data: {
          name,
        },
      });

      await CacheAndInsertData(cacheKey, model, status);

      SendSuccess(res, `${EMessage.insertSuccess}`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} status`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);
      const statusExists = await FindStatusById(id);
      if (!statusExists)
        return SendError(res, 400, `${EMessage.notFound} with id ${id}`);
      const status = await prisma.status.update({
        where: { id: id },
        data: data,
      });
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedData(cacheKey, model);
      SendSuccess(res, `${EMessage.updateSuccess} status`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} status`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const statusExists = await FindStatusById(id);
      if (!statusExists)
        return SendError(res, 400, `${EMessage.notFound} with id ${id}`);
      const status = await prisma.status.update({
        where: { id },
        data: { isActive: false },
      });
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedData(cacheKey, model);
      return SendSuccess(res, `${EMessage.deleteSuccess} status`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} status`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const status = await CacheAndRetrieveUpdatedData(cacheKey, model);
      return SendSuccess(res, `${EMessage.fetchAllSuccess} status`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} status`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;

      const status = await FindStatusById(id);
      if (!status)
        return SendError(res, 400, `${EMessage.notFound} with id ${id}`);

      SendSuccess(res, `${EMessage.fetchOneSuccess} status`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} status`, error);
    }
  },
};
export default StatusController;
