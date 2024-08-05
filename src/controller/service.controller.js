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
let cacheKey = "services";
const model = "service";
const select = {
  id: true,
  posterId: true,
  // categoryId: true,
  // statusId: true,
  // user:{}
  name: true,
  village: true,
  district: true,
  province: true,
  priceMonth: true,
  priceYear: true,
  priceCommission: true,
  detail: true,
  isShare: true,
  images: true,
  coverImage: true,
  createAt: true,
  updateAt: true,
  user: {
    select: {
      username: true,
      phoneNumber: true,
    },
  },
  category: {
    select: { title: true, icon: true },
  },
  status: {
    select: {
      name: true,
    },
  },
};
const ServiceController = {
  async Insert(req, res) {
    try {
      const validate = ValidateService(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput} ${validate.join(", ")}`
        );
      }
      let {
        posterId,
        categoryId,
        name,
        village,
        district,
        province,
        priceMonth,
        priceYear,
        priceCommission,
        detail,
        isShare,
        statusId,
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
      if (typeof priceMonth !== "number") {
        priceMonth = parseFloat(priceMonth);
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
        FindUserById(posterId),
        FindCategoryById(categoryId),
        FindStatusById(statusId),
      ]);
      if (!userExists || !statsExists || !categoryExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            !userExists ? "user" : !categoryExists ? "category" : "status"
          } with id:${
            !userExists ? posterId : !categoryExists ? categoryId : statusId
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
          posterId,
          categoryId,
          name,
          village,
          district,
          province,
          priceMonth,
          priceYear,
          priceCommission,
          detail,
          isShare,
          statusId,
          images: images_url_list,
          coverImage: coverImage_url,
        },
        select,
      });
      await redis.del(cacheKey + userId);
      await CacheAndInsertData(cacheKey, model, service, select);
      SendSuccess(res, `${EMessage.insertSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} service`, error);
    }
  },
   async Insert(req, res) {
    try {
      const validate = ValidateService(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput} ${validate.join(", ")}`
        );
      }
      let {
        posterId,
        categoryId,
        name,
        village,
        district,
        province,
        priceMonth,
        priceYear,
        priceCommission,
        detail,
        isShare,
        statusId,
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
      if (typeof priceMonth !== "number") {
        priceMonth = parseFloat(priceMonth);
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
        FindUserById(posterId),
        FindCategoryById(categoryId),
        FindStatusById(statusId),
      ]);
      if (!userExists || !statsExists || !categoryExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            !userExists ? "user" : !categoryExists ? "category" : "status"
          } with id:${
            !userExists ? posterId : !categoryExists ? categoryId : statusId
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
          posterId,
          categoryId,
          name,
          village,
          district,
          province,
          priceMonth,
          priceYear,
          priceCommission,
          detail,
          isShare,
          statusId,
          images: images_url_list,
          coverImage: coverImage_url,
        },
        select,
      });
      await redis.del(cacheKey + posterId);
      await CacheAndInsertData(cacheKey, model, service, select);
      SendSuccess(res, `${EMessage.insertSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.insertFailed} service`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);

      // Check if the service exists
      const serviceExists = await FindServiceById(id);
      if (!serviceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} service with id: ${id}`
        );
      }

      // Prepare promises to check existence of related entities
      const promiseList = [];
      if (data.posterId) {
        promiseList.push(FindUserById(data.posterId));
      }
      if (data.categoryId) {
        promiseList.push(FindCategoryById(data.categoryId));
      }
      if (data.statusId) {
        promiseList.push(FindStatusById(data.statusId));
      }

      // Resolve all promises
      const results = await Promise.all(promiseList);
      let userExists, categoryExists, statusExists;
      if (data.posterId) {
        userExists = results.shift();
      }
      if (data.categoryId) {
        categoryExists = results.shift();
      }
      if (data.statusId) {
        statusExists = results.shift();
      }
      if (
        (data.posterId && !userExists) ||
        (data.categoryId && !categoryExists) ||
        (data.statusId && !statusExists)
      ) {
        // Check if any related entities do not exist
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            data.posterId && !userExists
              ? "user"
              : data.categoryId && !categoryExists
              ? "category"
              : "status"
          } with id: ${
            data.posterId && !userExists
              ? data.posterId
              : data.categoryId && !categoryExists
              ? data.categoryId
              : data.statusId
          }`
        );
      }

      // Convert prices to numbers if they are provided and not already numbers
      if (data.priceMonth && typeof data.priceMonth !== "number") {
        data.priceMonth = parseFloat(data.priceMonth);
      }
      if (data.priceYear && typeof data.priceYear !== "number") {
        data.priceYear = parseFloat(data.priceYear);
      }
      if (data.priceCommission && typeof data.priceCommission !== "number") {
        data.priceCommission = parseFloat(data.priceCommission);
      }

      // Convert isShare to boolean if it is provided and not already a boolean
      if (data.isShare && typeof data.isShare !== "boolean") {
        data.isShare = data.isShare === "true";
      }

      // Update the service
      const service = await prisma.service.update({
        where: { id },
        data,
      });

      // Clear the cache
      await redis.del(cacheKey, cacheKey + serviceExists.posterId);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
      // Send success response
      SendSuccess(res, `${EMessage.updateSuccess} service`, service);
    } catch (error) {
      // Handle errors
      SendErrorCatch(res, `${EMessage.updateFailed} service`, error);
    }
  },
  async UpdateCoverImage(req, res) {
    try {
      const id = req.params.id;
      const { old_coverImage } = req.body;
      if (!old_coverImage) {
        return SendError(res, 400, `${EMessage.pleaseInput} old_coverImage`);
      }
      const data = req.files;
      if (!data || !data.coverImage) {
        return SendError(res, 400, `${EMessage.pleaseInput}: coverImage`);
      }
      const serviceExists = await FindServiceById(id);
      if (!serviceExists) {
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
      await redis.del(cacheKey, cacheKey + serviceExists.posterId);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
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
      if (!oldImages) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldImages`);
      }
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
      if (!serviceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} service with id:${id}`
        );
      }
      const OldImageList = serviceExists.images;
      let images_url_List = CheckUniqueElement(OldImageList, oldImages);
      const ImagesPromises = dataImagesToList.map((img, i) =>
        UploadImage(img.data, oldImages[i]).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );
      const images_url_list = await Promise.all(ImagesPromises);
      images_url_List = images_url_List.concat(images_url_list);
      const service = await prisma.service.update({
        where: { id },
        data: { images: images_url_List },
      });
      await redis.del(cacheKey, cacheKey + serviceExists.posterId);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
      SendSuccess(res, `${EMessage.updateSuccess} service images`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} service images`, error);
    }
  },
  async UpdateIsShare(req, res) {
    try {
      const id = req.params.id;
      let { isShare } = req.body;
      if (!isShare) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: Share is required`
        );
      }
      if (isShare && typeof isShare !== "boolean") {
        isShare = isShare === "true";
      }
      const serviceExists = await FindServiceById(id);
      if (!serviceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} service with id:${id}`
        );
      }
      const service = await prisma.service.update({
        where: { id },
        data: {
          isShare,
        },
      });
      await redis.del(cacheKey, cacheKey + serviceExists.posterId);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
      SendSuccess(res, `${EMessage.updateSuccess} service `, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} service`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const serviceExists = await FindServiceById(id);
      if (!serviceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} service with id:${id}`
        );
      }
      const service = await prisma.service.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await redis.del(cacheKey, cacheKey + serviceExists.posterId);
      CacheAndRetrieveUpdatedData(cacheKey, model, select);
      SendSuccess(res, `${EMessage.deleteSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} service`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const service = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        select
      );
      SendSuccess(res, `${EMessage.selectAllSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} service`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const service = await FindServiceById(id);
      if (!service) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} service with id:${id}`
        );
      }
      SendSuccess(res, `${EMessage.deleteSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} service`, error);
    }
  },
  async SelectByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const service = await CacheAndRetrieveUpdatedData(
        cacheKey + userId,
        model,
        select
      );
      SendSuccess(
        res,
        `${EMessage.selectAllSuccess} service by userId`,
        service
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} service by userId`,
        error
      );
    }
  },
};
export default ServiceController;
