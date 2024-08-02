import redis from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import { FindStatusById } from "../service/find.js";
import { SendError, SendErrorCatch, SendSuccess } from "../service/service.js";
import { DataExist, ValidateStatus } from "../service/validate.js";
import prisma from "../util/Prisma.js";

const cachedKey = "status";
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

      const cacheData = await redis.get(cachedKey);

      if (!cacheData) {
        const statuses = await prisma.status.findMany({
          where: { isActive: true },
          orderBy: { createAt: "desc" },
        });
        await redis.set(cachedKey, JSON.stringify(statuses), "EX", 3600);
      } else {
        const statusData = JSON.parse(cacheData);
        statusData.unshift(status);
        await redis.set(cachedKey, JSON.stringify(statusData), "EX", 3600);
      }

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
      await redis.del(cachedKey, cachedKey + id);
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
      await redis.del(cachedKey, cachedKey + id);
      return SendSuccess(res, `${EMessage.deleteSuccess} status`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} status`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      let status;
      const cashData = await redis.get(cachedKey);
      if (!cashData) {
        status = await prisma.status.findMany({
          where: {
            isActive: true,
          },
        });
        await redis.set(cachedKey, JSON.stringify(status), "EX", 3600);
      } else {
        status = JSON.parse(cashData);
      }
      return SendSuccess(res, `${EMessage.fetchAllSuccess} status`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} status`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      //   await redis.del(cachedKey + id);
      const cashData = await redis.get(cachedKey + id);
      console.log("object :>> ", cashData);
      let status;
      if (!cashData) {
        status = await FindStatusById(id);
        await redis.set(cachedKey + id, JSON.stringify(status), "EX", 3600);
      } else {
        status = JSON.parse(cashData);
      }
      SendSuccess(res, `${EMessage.fetchOneSuccess} status`, status);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} status`, error);
    }
  },
};
export default StatusController;
