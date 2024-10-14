import { StatusType } from "../service/enum.js";
import client from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import {
  FindOrderById,
  FindPaymentById,
  FindPromotionId,
  FindServiceById,
  FindUserById,
} from "../service/find.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";

import { DataExist, ValidateOrder } from "../service/validate.js";
import prisma from "../util/prismaClient.js";
import { S3UploadImage } from "../service/s3UploadImage.js";
let cacheKey = "orders";
const model = "order";
let where = { isActive: true };
let select = {
  id: true,
  userId: true,
  serviceId: true,
  firstname: true,
  lastname: true,
  phoneNumber: true,
  village: true,
  district: true,
  province: true,
  paymentId: true,
  promotionId: true,
  bookingPrice: true,
  totalPrice: true,
  billQR: true,
  createAt: true,
  updateAt: true,
  service: true,
  status: true,
  service: {
    include: {
      status: true,
      category: true,
      user: true,
    },
  },
  promotion: {
    select: {
      code: true,
      qty: true,
      startTime: true,
      endTime: true,
    },
  },
};
const OrderController = {
  async Insert(req, res) {
    try {
      // Validate the order input
      const validate = ValidateOrder(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }

      let {
        userId,
        firstname,
        lastname,
        phoneNumber,
        village,
        district,
        province,
        serviceId,
        paymentId,
        bookingPrice,
        totalPrice,
        promotionId,
      } = req.body;
      const data = req.files;

      // Check if the required billQR file is present
      if (!data || !data.billQR) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: billQR is required`
        );
      }

      // Convert bookingPrice and totalPrice to numbers if necessary
      if (typeof bookingPrice !== "number") {
        bookingPrice = parseFloat(bookingPrice);
      }
      if (typeof totalPrice !== "number") {
        totalPrice = parseFloat(totalPrice);
      }
      let promise = [
        FindUserById(userId),
        FindServiceById(serviceId),
        FindPaymentById(paymentId),
      ];

      if (promotionId) {
        promise.push(FindPromotionId(promotionId));
      }
      // Check if related entities exist
      const [userExists, serviceExists, paymentExists, promotionExists] =
        await Promise.all(promise);

      // Identify and report which related entity does not exist
      if (
        (userId && !userExists) ||
        (serviceId && !serviceExists) ||
        (paymentId && !paymentExists) ||
        (promotionId && !promotionExists)
      ) {
        return SendError(
          res,
          404,
          `${EMessage.notFound}: ${
            !userExists
              ? "user"
              : !serviceExists
              ? "service"
              : !paymentExists
              ? "payment"
              : "promotion"
          } with id: ${
            !userExists
              ? userId
              : !serviceExists
              ? serviceId
              : !paymentExists
              ? paymentId
              : promotionId
          }`
        );
      }

      // Upload the billQR image
      const img_url = await S3UploadImage(data.billQR).then((url) => {
        if (!url) throw new Error("Uploaded image failed");
        return url;
      });

      // Create the order
      const order = await prisma.order.create({
        data: {
          userId,
          serviceId,
          paymentId,
          promotionId,
          bookingPrice,
          totalPrice,
          billQR: img_url,
          firstname,
          lastname,
          phoneNumber,
          village,
          district,
          province,
        },
        select,
      });

      // Cache the order and send a success response
      await client.del([cacheKey + userId, cacheKey + serviceId]);
      CacheAndInsertData(cacheKey, model, where, order, select);
      SendCreate(res, `${EMessage.insertSuccess}`, order);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} order`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);

      // Convert bookingPrice and totalPrice to numbers if they exist and aren't already numbers
      if (data.bookingPrice) {
        data.bookingPrice =
          typeof data.bookingPrice === "number"
            ? data.bookingPrice
            : parseFloat(data.bookingPrice);
      }
      if (data.totalPrice) {
        data.totalPrice =
          typeof data.totalPrice === "number"
            ? data.totalPrice
            : parseFloat(data.totalPrice);
      }

      // Convert isShare to boolean if it exists and isn't already boolean
      if (data.isShare) {
        data.isShare =
          typeof data.isShare === "boolean"
            ? data.isShare
            : data.isShare === "true";
      }

      // Check if the order exists
      const orderExists = await FindOrderById(id);
      if (!orderExists) {
        return SendError(res, 404, `${EMessage.notFound} order with id ${id}`);
      }

      // Prepare promises to check if related entities exist
      const promiseList = [];
      const resultIndices = {}; // Keep track of indices for result mapping

      if (data.userId) {
        promiseList.push(FindUserById(data.userId));
        resultIndices.userExists = promiseList.length - 1;
      }
      if (data.serviceId) {
        promiseList.push(FindServiceById(data.serviceId));
        resultIndices.serviceExists = promiseList.length - 1;
      }
      if (data.promotionId) {
        promiseList.push(FindPromotionId(data.promotionId));
        resultIndices.promotionExists = promiseList.length - 1;
      }
      if (data.paymentId) {
        promiseList.push(FindPaymentById(data.paymentId));
        resultIndices.paymentExists = promiseList.length - 1;
      }

      // Resolve all promises
      const results = await Promise.all(promiseList);

      // Extract results based on their presence in the promise list
      const userExists =
        resultIndices.userExists !== undefined
          ? results[resultIndices.userExists]
          : true;
      const serviceExists =
        resultIndices.serviceExists !== undefined
          ? results[resultIndices.serviceExists]
          : true;
      const promotionExists =
        resultIndices.promotionExists !== undefined
          ? results[resultIndices.promotionExists]
          : true;
      const paymentExists =
        resultIndices.paymentExists !== undefined
          ? results[resultIndices.paymentExists]
          : true;

      // Check if any of the related entities do not exist and return appropriate error
      if (
        (data.userId && !userExists) ||
        (data.serviceId && !serviceExists) ||
        (data.promotionId && !promotionExists) ||
        (data.paymentId && !paymentExists)
      ) {
        return SendError(
          res,
          404,
          `${EMessage.notFound}: ${
            !userExists
              ? "user"
              : !serviceExists
              ? "service"
              : !promotionExists
              ? "promotion"
              : "payment"
          } with id ${
            !userExists
              ? data.userId
              : !serviceExists
              ? data.serviceId
              : !promotionExists
              ? data.promotionId
              : data.paymentId
          }`
        );
      }

      // Update the order
      const order = await prisma.order.update({
        where: { id },
        data,
      });

      // console.log("object :>> ", cacheKey, cacheKey + orderExists.userId);
      // Clear the cache
      await client.del([
        cacheKey,
        cacheKey + orderExists.userId,
        cacheKey + orderExists.serviceId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      // Send success response
      SendSuccess(res, `${EMessage.updateSuccess} order`, order);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} order`, error);
    }
  },
  async UpdateStatus(req, res) {
    try {
      const id = req.params.id;
      let { status } = req.body;
      if (!status) {
        return SendError(res, 400, `${EMessage.pleaseInput} status`);
      }
      if (!Object.values(StatusType).includes(status)) {
        return SendError(
          res,
          400,
          `${EMessage.invalidInput} status. Valid options are: ${Object.values(
            StatusType
          ).join(", ")}`
        );
      }

      const orderExists = await FindOrderById(id);
      if (!orderExists) {
        SendError(res, 404, `${EMessage.notFound} order with id ${id}`);
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
      });
      await client.del([
        cacheKey,
        cacheKey + orderExists.userId,
        cacheKey + orderExists.serviceId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess} order`, order);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} order  status`, error);
    }
  },

  async UpdateBillQR(req, res) {
    try {
      const id = req.params.id;
      let { old_billQR } = req.body;
      if (!old_billQR) {
        return SendError(res, 400, `${EMessage.pleaseInput} :old_billQR`);
      }
      const data = req.files;
      if (!data || !data.billQR) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: billQR is required`
        );
      }
      const orderExists = await FindOrderById(id);
      if (!orderExists) {
        SendError(res, 404, `${EMessage.notFound} order with id ${id}`);
      }
      const img_url = await S3UploadImage(data.billQR, old_billQR).then(
        (url) => {
          if (!url) throw new Error("Uploaded image failed");
          return url;
        }
      );
      const order = await prisma.order.update({
        where: { id },
        data: { billQR: img_url },
      });

      await client.del([
        cacheKey,
        cacheKey + orderExists.userId,
        cacheKey + orderExists.serviceId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess} order`, order);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} order billQR`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const orderExists = await FindOrderById(id);
      if (!orderExists) {
        SendError(res, 404, `${EMessage.notFound} order with id ${id}`);
      }
      const order = await prisma.order.update({
        where: { id },
        data: { isActive: false },
      });
      await client.del([
        cacheKey,
        cacheKey + orderExists.userId,
        cacheKey + orderExists.serviceId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.deleteSuccess} order`, order);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} order`, error);
    }
  },

  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const order = await FindOrderById(id);
      if (!order) {
        SendError(res, 404, `${EMessage.notFound} order with id ${id}`);
      }
      SendSuccess(res, `${EMessage.deleteSuccess} order`, order);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} order`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const order = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where,
        select
      );
      SendSuccess(res, `${EMessage.fetchAllSuccess} order`, order);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} order`, error);
    }
  },
  async SelectByUserId(req, res) {
    try {
      const userId = req.params.userId;

      const order = await CacheAndRetrieveUpdatedData(
        cacheKey + userId,
        model,
        { isActive: true, userId },
        select
      );
      SendSuccess(res, `${EMessage.fetchAllSuccess} order by userId `, order);
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} order by userId`,
        error
      );
    }
  },

  async SelectByPosterId(req, res) {
    try {
      const posterId = req.params.posterId;

      const order = await CacheAndRetrieveUpdatedData(
        cacheKey + posterId,
        model,
        { 
          isActive: true,
          service: {
            posterId: posterId
          }
         },
        select
      );
      SendSuccess(res, `${EMessage.fetchAllSuccess} order by posterId `, order);
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} order by posterId`,
        error
      );
    }
  },

  async SelectByservicesId(req, res) {
    try {
      const servicesId = req.params.servicesId;

      const order = await CacheAndRetrieveUpdatedData(
        cacheKey + servicesId,
        model,
        { isActive: true, serviceId: servicesId },
        select
      );
      SendSuccess(res, `${EMessage.fetchAllSuccess}  `, order);
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} order by userId`,
        error
      );
    }
  },
};

export default OrderController;
