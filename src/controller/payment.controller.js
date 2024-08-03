import redis from "../Database/radis.js";
import { EMessage } from "../service/enum";
import { FindPaymentById } from "../service/find.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { UploadImage } from "../service/uploadImage.js";
import { DataExist, ValidatePayment } from "../service/validate.js";
import prisma from "../util/Prisma.js";
const cacheKey = "payments";
const model = "payment";
const PaymentController = {
  async Insert(req, res) {
    try {
      const validate = ValidatePayment(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }
      const { bankName, accountName, accountNo } = req.body;

      const data = req.files;
      if (!data && !data.qr_image) {
        return SendError(res, 400, `${EMessage.pleaseInput}: qr_image`);
      }
      const imgUrl = await UploadImage(data.qr_image.data);
      const payment = await prisma.payment.create({
        data: {
          bankName,
          accountNo,
          accountName,
          qr_image: imgUrl,
        },
      });
      await CacheAndInsertData(cacheKey, model, payment);

      SendCreate(res, `${EMessage.insertSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} payment`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.body.id;
      const data = DataExist(req.body);
      if (data.status && typeof data.status !== "boolean") {
        data.status = data.status === "true";
      }
      const paymentExists = await FindPaymentById(id);
      if (!paymentExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} payment with id:${id}`
        );
      }
      const payment = await prisma.payment.update({
        where: { id },
        data,
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.updateSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} payment`, error);
    }
  },
  async UpdateImage(req, res) {
    try {
      const id = req.body.id;
      const { old_qr_image } = req.body;
      if (!old_qr_image) {
        return SendError(res, 400, `${EMessage.pleaseInput}: old_qr_image`);
      }
      const data = req.files;
      if (!data && !data.qr_image) {
        return SendError(res, 400, `${EMessage.pleaseInput}: qr_image`);
      }
      const paymentExists = await FindPaymentById(id);
      if (!paymentExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} payment with id:${id}`
        );
      }
      const img_url = await UploadImage(data.qr_image.data, old_qr_image);
      const payment = await prisma.payment.update({
        where: { id },
        data: {
          qr_image: img_url,
        },
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.updateSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} payment image`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.body.id;
      const paymentExists = await FindPaymentById(id);
      if (!paymentExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} payment with id:${id}`
        );
      }
      const payment = await prisma.payment.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.deleteSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} payment`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const payment = await CacheAndRetrieveUpdatedData(cacheKey, model);
      SendSuccess(res, `${EMessage.selectAllSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} payment`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.body.id;
      const payment = await FindPaymentById(id);
      if (!payment) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} payment with id:${id}`
        );
      }
      SendSuccess(res, `${EMessage.fetchOneSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} payment`, error);
    }
  },

  async SelectByIsPublic(req, res) {
    try {
      const { isPublic } = req.body;
      const data = await CacheAndRetrieveUpdatedData(cacheKey, model);
      const payment = data.find((item) => item.isPublic === isPublic);
      SendSuccess(res, `${EMessage.selectAllSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.fetchAllSuccess} payment by isPublic`,
        error
      );
    }
  },
};

export default PaymentController;
