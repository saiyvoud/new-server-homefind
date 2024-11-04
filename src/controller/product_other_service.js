import { EMessage } from "../service/enum.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { DataExist, validateData } from "../service/validate.js";
import prisma from "../util/prismaClient.js";
import { S3UploadImage } from "../service/s3UploadImage.js";
import {
  FindotherServiceById,
  FindproductOtherServiceById,
  FindUserById,
} from "../service/find.js";
import { DeleteCachedKey } from "../service/cach.deletekey.js";
let cacheKey = "productOtherService";
let where = { isActive: true };
const model = "productOtherService";
let select = {
  id: true,
  otherId: true,
  name: true,
  price: true,
  details: true,
  coverImage: true,
  createAt: true,
  updateAt: true,
};

const ReFreshCashData = async ({ key, keyOther }) => {
  const promise = [];
  if (key) DeleteCachedKey(key);
  if (keyOther) DeleteCachedKey(keyOther);

  await Promise.all(promise);
};

const productOtherServiceController = {
  async Insert(req, res) {
    try {
      let { name, otherId, price, details } = req.body;
      const validate = validateData({
        name,
        otherId,
        price,
        details,
      });
      if (price && typeof price !== "number") {
        price = parseFloat(price);
      }

      const coverImage = req?.files?.coverImage;

      if (!coverImage) {
        return SendError(res, 400, `${EMessage.pleaseInput}:coverImage`);
      }

      if (validate.length > 0)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(",")}`
        );

      const [otherServiceExists] = await Promise.all([
        FindotherServiceById(otherId),
      ]);
      if (!otherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherservice with id:${otherId}`
        );
      }

      const coverImage_url = await S3UploadImage(coverImage).then((url) => {
        if (!url) {
          throw new Error("Upload Image failed");
        }
        return url;
      });

      const productOtherService = await prisma.productOtherService.create({
        data: {
          name,
          otherId,
          price,
          details,
          coverImage: coverImage_url,
        },
      });
      await ReFreshCashData({
        keyOther: otherId + cacheKey,
      });

      await CacheAndInsertData(
        cacheKey,
        model,
        where,
        productOtherService,
        select
      );
      SendSuccess(
        res,
        `${EMessage.insertSuccess} productOtherService`,
        productOtherService
      );
    } catch (err) {
      return SendErrorCatch(
        res,
        `${EMessage.insertFailed} productOtherService`,
        err
      );
    }
  },

  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);

      const productOtherServiceExists = await FindproductOtherServiceById(id);
      if (!productOtherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} productOtherService with id: ${id}`
        );
      }

      const promiseList = [];
      if (data.otherId) {
        promiseList.push(FindUserById(data.otherId));
      }

      // Resolve all promises
      const results = await Promise.all(promiseList);
      let otherServiceExists;
      if (data.otherId) otherServiceExists = results.shift();

      // Check if any related entities do not exist
      if (data.otherId && !otherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherService with id: ${data.otherId}`
        );
      }

      const productOtherService = await prisma.productOtherService.update({
        where: { id },
        data,
      });
      await ReFreshCashData({
        key: cacheKey,
        keyOther: productOtherServiceExists.otherId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(
        res,
        `${EMessage.updateSuccess} service`,
        productOtherService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} productOtherService`,
        error
      );
    }
  },

  async UpdateCoverImage(req, res) {
    try {
      const id = req.params.id;
      const { old_coverImage } = req.body;
      const coverImage = req.files?.coverImage;
      if (!coverImage) {
        return SendError(res, 400, `${EMessage.pleaseInput}: coverImage`);
      }
      if (!old_coverImage) {
        return SendError(res, 400, `${EMessage.pleaseInput} old_coverImage`);
      }
      const productOtherServiceExists = await FindproductOtherServiceById(id);
      const coverImage_url = await S3UploadImage(
        coverImage,
        old_coverImage
      ).then((url) => {
        if (!url) throw new Error("Upload image failed");
        return url;
      });

      const productOtherService = await prisma.productOtherService.update({
        where: { id },
        data: { coverImage: coverImage_url },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyOther: productOtherServiceExists.otherId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} coverImage productOtherService`,
        productOtherService
      );
    } catch (err) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} coverImage productOtherService`,
        err
      );
    }
  },

  async Delete(req, res) {
    try {
      const id = req.params.id;
      const productOtherServiceExists = await FindproductOtherServiceById(id);
      if (!productOtherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} productOtherService with id: ${id}`
        );
      }

      const productOtherService = await prisma.productOtherService.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyOther: productOtherServiceExists.otherId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.deleteSuccess} productOtherService`,
        productOtherService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.deleteFailed}  productOtherService`,
        error
      );
    }
  },
  async SelectAll(req, res) {
    try {
      const productOtherService = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where,
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} productOtherService`,
        productOtherService
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} productOtherService`,
        error
      );
    }
  },

  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const productOtherService = await FindproductOtherServiceById(id);
      if (!productOtherService) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} productOtherService with id: ${id}`
        );
      }
      SendSuccess(
        res,
        `${EMessage.fetchOneSuccess} productOtherService`,
        productOtherService
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingOne} productOtherService`,
        error
      );
    }
  },

  async SelectByOtherServiceId(req, res) {
    try {
      const otherId = req.params.otherId;
      const productOtherService = await CacheAndRetrieveUpdatedData(
        otherId + cacheKey,
        model,
        { otherId, isActive: true },
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} productOtherService by otherId`,
        productOtherService
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} productOtherService by otherId`,
        error
      );
    }
  },
};
export default productOtherServiceController;
