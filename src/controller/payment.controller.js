import client from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import { FindPaymentById } from "../service/find.js";
import { S3UploadImage } from "../service/s3UploadImage.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";

import { DataExist, ValidatePayment } from "../service/validate.js";
import prisma from "../util/prismaClient.js";
const cacheKey = "payments";
const model = "payment";
let where = { isActive: true };
let select;
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
      if (!data || !data.qr_Image) {
        return SendError(res, 400, `${EMessage.pleaseInput}: qr_Image`);
      }
      const imgUrl =  await S3UploadImage(data.qr_Image);
      const payment = await prisma.payment.create({
        data: {
          bankName,
          accountNo,
          accountName,
          qr_Image: imgUrl,
        },
      });
      await CacheAndInsertData(cacheKey, model, where, payment, select);

      SendCreate(res, `${EMessage.insertSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} payment`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);
      if (data.isPublic && typeof data.isPublic !== "boolean") {
        data.isPublic = data.isPublic === "true";
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
      await client.del(cacheKey);
    await  CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} payment`, error);
    }
  },
  async UpdateImage(req, res) {
    try {
      const id = req.params.id;
      const { old_qr_Image } = req.body;
      if (!old_qr_Image) {
        return SendError(res, 400, `${EMessage.pleaseInput}: old_qr_Image`);
      }
      const data = req.files;
      if (!data || !data.qr_Image) {
        return SendError(res, 400, `${EMessage.pleaseInput}: qr_Image`);
      }
      const paymentExists = await FindPaymentById(id);
      if (!paymentExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} payment with id:${id}`
        );
      }
      const img_url = await   S3UploadImage(data.qr_Image, old_qr_Image);
      const payment = await prisma.payment.update({
        where: { id },
        data: {
          qr_Image: img_url,
        },
      });
      await client.del(cacheKey);
    await   CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} payment image`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
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
      await client.del(cacheKey);
    await  CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.deleteSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} payment`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const payment = await  CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.selectAllSuccess}`, payment);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} payment`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
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
      const data = await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      const payment = data.filter((item) => item.isPublic === true);
      SendSuccess(res, `${EMessage.fetchAllSuccess} by isPublic`, payment);
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
