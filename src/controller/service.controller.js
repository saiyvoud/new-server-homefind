import redis from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import {
  FindCategoryById,
  FindServiceById,
  FindStatusById,
  FindUserById,
} from "../service/find.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  CheckUniqueElement,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { UploadImage } from "../service/uploadImage.js";
import { DataExist, ValidateService } from "../service/validate.js";
import prisma from "../util/Prisma.js";
const cacheKey = "services";
const model = "service";
const ServiceController = {
  async Insert(req, res) {
    try {
      const validate = ValidateService(req.body);
      if (validate.length > 0) {
        SendError(res, 400, `${EMessage.pleaseInput} ${validate.join(", ")}`);
      }
      let {
        poster_id,
        category_id,
        name,
        village,
        district,
        province,
        priceMoth,
        priceYear,
        priceCommission,
        detail,
        isShare,
        status_id,
      } = req.body;
      const data = req.files;
      if (!data || !data.images || !data.coverImage) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${
            !data
              ? "images, coverImage"
              : !data.images
              ? "images"
              : "coverImage"
          }`
        );
      }
      if (typeof priceMoth !== "number") {
        priceMoth = parseFloat(priceMoth);
      }
      if (typeof priceYear !== "number") {
        priceYear = parseFloat(priceYear);
      }
      if (typeof priceCommission !== "number") {
        priceCommission = parseFloat(priceCommission);
      }
      if (typeof isShare !== "boolean") {
        isShare = isShare === "true";
      }
      const [userExists, categoryExists, statsExists] = await Promise.all([
        FindUserById(poster_id),
        FindCategoryById(category_id),
        FindStatusById(status_id),
      ]);
      if (!userExists || !statsExists || !categoryExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            !userExists ? "user" : !categoryExists ? "category" : "status"
          } with id:${
            !userExists ? poster_id : !categoryExists ? category_id : status_id
          }`
        );
      }
      const ImagesPromise = data.images.map((img) =>
        UploadImage(img.data).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );
      const CoverImagePromise = UploadImage(data.coverImage.data).then(
        (url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        }
      );

      const [coverImage_url, images_url_list] = await Promise.all([
        CoverImagePromise,
        Promise.all(ImagesPromise),
      ]);
      const service = await prisma.service.create({
        data: {
          poster_id,
          category_id,
          name,
          village,
          district,
          province,
          priceMoth,
          priceYear,
          priceCommission,
          detail,
          isShare,
          status_id,
          images: images_url_list,
          coverImage: coverImage_url,
        },
      });
      await CacheAndInsertData(cacheKey, model, service);
      SendSuccess(res, `${EMessage.insertSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} service`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);
      const serviceExists = await FindServiceById(id);
      if (serviceExists) {
        SendError(res, 404, `${EMessage.notFound} service with id:${id}`);
      }
      const promiseList = [];
      if (data.poster_id) {
        promiseList.push(FindUserById(data.poster_id));
      }
      if (data.category_id) {
        promiseList.push(FindCategoryById(data.category_id));
      }
      if (data.status_id) {
        promiseList.push(FindStatusById(data.status_id));
      }
      const [userExists, categoryExists, statsExists] = await Promise.all(
        promiseList
      );
      if (
        (data.poster_id && !userExists) ||
        (data.status_id && !statsExists) ||
        (data.category_id && !categoryExists)
      ) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            !userExists ? "user" : !categoryExists ? "category" : "status"
          } with id:${
            !userExists
              ? data.poster_id
              : !categoryExists
              ? data.category_id
              : data.status_id
          }`
        );
      }
      if (data.priceMoth && typeof data.priceMoth !== "number") {
        data.priceMoth = parseFloat(data.priceMoth);
      }
      if (data.priceYear && typeof data.priceYear !== "number") {
        data.priceYear = parseFloat(data.priceYear);
      }
      if (data.priceCommission && typeof data.priceCommission !== "number") {
        data.priceCommission = parseFloat(data.priceCommission);
      }
      if (data.isShare && typeof data.isShare !== "boolean") {
        data.isShare = data.isShare === "true";
      }
      const service = await prisma.service.update({
        where: { id },
        data,
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.updateSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} service`, error);
    }
  },

  async UpdateCoverImage(req, res) {
    try {
      const id = req.params.id;
      const old_coverImage = req.body;
      if (!old_coverImage) {
        return SendError(res, 400, `${EMessage.pleaseInput} old_coverImage`);
      }
      const data = req.files;
      if (!data || !data.coverImage) {
        return SendError(res, 400, `${EMessage.pleaseInput}: coverImage`);
      }
      const serviceExists = await FindServiceById(id);
      if (serviceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} service with id:${id}`
        );
      }
      const coverImage_url = await UploadImage(
        data.coverImage.data,
        old_coverImage
      ).then((url) => {
        if (!url) throw new Error("Upload image failed");
        return url;
      });
      const service = await prisma.service.update({
        where: { id },
        data: {
          coverImage: coverImage_url,
        },
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.updateSuccess} service coverImage`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} service coverImage`, error);
    }
  },

  async UpdateImages(req, res) {
    try {
      const id = req.params.id;
      const data = req.files;
      let { oldImages } = req.body;
      oldImages = oldImages.split(",");
      if (oldImages.length === 0) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldImages`);
      }
      if (!data || !data.images) {
        return SendError(res, 400, `${EMessage.pleaseInput}: images`);
      }

      const dataImagesToList = !data.images.length
        ? [data.images]
        : data.images;
      if (dataImagesToList.length !== oldImages.length) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: The number of provided docImage files does not match the existing records. Please ensure you have uploaded the correct number of images.`
        );
      }
      const serviceExists = await FindServiceById(id);
      if (serviceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} service with id:${id}`
        );
      }
      const OldImageList = serviceExists.images;
      let imagesList = CheckUniqueElement(OldImageList, oldImages);
      const ImagesPromises = dataImagesToList.map((img, i) =>
        UploadImage(img.data, oldImages[i]).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );
      const images_url_list = await Promise.all(ImagesPromises);
      imagesList = imagesList.concat(images_url_list);
      const service = await prisma.service.update({
        where: { id },
        data: { images: images_url_list },
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.updateSuccess} service images`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} service images`, error);
    }
  },
  async UpdateIsShare(req, res) {
    try {
      const id = req.params.id;
      const { isShare } = req.body;
      if (!isShare) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: Share is required`
        );
      }
      const serviceExists = await FindServiceById(id);
      if (serviceExists) {
        SendError(res, 404, `${EMessage.notFound} service with id:${id}`);
      }
      const service = await prisma.service.update({
        where: { id },
        data: {
          isShare,
        },
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.updateSuccess} service `, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} service`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const serviceExists = await FindServiceById(id);
      if (serviceExists) {
        SendError(res, 404, `${EMessage.notFound} service with id:${id}`);
      }
      const service = await prisma.service.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await redis.del(cacheKey);
      SendSuccess(res, `${EMessage.deleteSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} service`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const service = await CacheAndRetrieveUpdatedData(cacheKey, model);
      SendSuccess(res, `${EMessage.selectAllSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} service`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const service = await FindServiceById(id);
      if (service) {
        SendError(res, 404, `${EMessage.notFound} service with id:${id}`);
      }
      SendSuccess(res, `${EMessage.deleteSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} service`, error);
    }
  },
};
export default ServiceController;
