import redis from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import {
  FindOrderById,
  FindReviewById,
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
import { DataExist, ValidateReview } from "../service/validate.js";
import prisma from "../util/prismaClient.js";
const cacheKey = "reviews";
const model = "review";
const select = {
  id: true,
  userId: true,
  orderId: true,
  reason: true,
  star: true,
  createAt: true,
  updateAt: true,
  user: {
    select: {
      username: true,
      phoneNumber: true,
    },
  },
};
const ReviewController = {
  async Insert(req, res) {
    try {
      const validate = ValidateReview(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }
      let { userId, orderId, reason, star } = req.body;
      if (typeof star !== "number") star = parseFloat(star);
      const [userExists, orderExists] = await Promise.all([
        FindUserById(userId),
        FindOrderById(orderId),
      ]);
      if (!userExists || !orderExists)
        return SendError(
          res,
          404,
          `${EMessage.notFound}:${!userExists ? "user" : "order"} with id: ${
            !userExists ? userId : orderId
          }`
        );
      const review = await prisma.review.create({
        data: {
          userId,
          orderId,
          reason,
          star,
        },
        select,
      });
      CacheAndInsertData(cacheKey, model, review, select);
     return SendCreate(res, `${EMessage.insertSuccess}`, review);
    } catch (error) {
     return SendErrorCatch(res, `${EMessage.insertFailed} review`, error);
    }
  },

  async Update(req, res) {
    try {
      const id = req.params.id;
      let data = DataExist(req.body);
      let promiseList = [];
      let userExists, orderExists;

      if (data.star && typeof data.star !== "number")
        data.star = parseFloat(data.star);
      // ตรวจสอบการมีอยู่ของ review
      const reviewExists = await FindReviewById(id);
      if (!reviewExists) {
        return SendError(res, 404, `${EMessage.notFound} review with id ${id}`);
      }

      // ตรวจสอบการมีอยู่ของ userId และ orderId และใส่การเรียกใช้งานที่เกี่ยวข้องใน promiseList
      if (data.userId) {
        promiseList.push(FindUserById(data.userId));
      }
      if (data.orderId) {
        promiseList.push(FindOrderById(data.orderId));
      }

      // รอให้ promises ทั้งหมดถูก resolve
      const results = await Promise.all(promiseList);

      // กำหนดค่าผลลัพธ์จาก promiseList ให้กับตัวแปรที่ถูกต้อง
      if (data.userId) {
        userExists = results.shift();
      }
      if (data.orderId) {
        orderExists = results.shift();
      }

      // ตรวจสอบว่ามี data.userId หรือ data.orderId แล้วค่าที่ได้รับเป็น false หรือไม่
      if ((data.userId && !userExists) || (data.orderId && !orderExists)) {
        const notFoundEntity = data.userId && !userExists ? "user" : "order";
        const notFoundId =
          data.userId && !userExists ? data.userId : data.orderId;
        return SendError(
          res,
          404,
          `${EMessage.notFound}: ${notFoundEntity} with id: ${notFoundId}`
        );
      }

      // ทำการ update review
      const review = await prisma.review.update({
        where: { id },
        data,
      });

      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
      // ส่ง response ที่สำเร็จ
     return SendSuccess(res, `${EMessage.updateSuccess}`, review);
    } catch (error) {
      // จัดการข้อผิดพลาด
     return SendErrorCatch(res, `${EMessage.updateFailed} review`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const reviewExists = await FindReviewById(id);
      if (!reviewExists) {
        return SendError(res, 404, `${EMessage.notFound} review with id ${id}`);
      }
      const review = await prisma.review.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
     return SendSuccess(res, `${EMessage.deleteSuccess}`, review);
    } catch (error) {
     return SendErrorCatch(res, `${EMessage.deleteFailed} review`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const review = await  CacheAndRetrieveUpdatedData(cacheKey, model, select);
     return SendSuccess(res, `${EMessage.fetchAllSuccess}`, review);
    } catch (error) {
     return SendErrorCatch(res, `${EMessage.errorFetchingAll} review`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const review = await FindReviewById(id);
      if (!review) {
       return SendError(res, 404, `${EMessage.notFound} review with id ${id}`);
      }
     return SendSuccess(res, `${EMessage.fetchOneSuccess}`, review);
    } catch (error) {
     return SendErrorCatch(res, `${EMessage.errorFetchingOne} review`, error);
    }
  },
};
export default ReviewController;
