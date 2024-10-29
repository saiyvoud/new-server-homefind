import client from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import {
  FindCategoryById,
  FindServiceById,
  FindStatusById,
  FindUserById,
} from "../service/find.js";
import { S3UploadImage } from "../service/s3UploadImage.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  CheckUniqueElement,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";

import { DataExist, ValidateService } from "../service/validate.js";
import prisma from "../util/prismaClient.js";
let cacheKey = "services";
let where = { isActive: true };
const model = "service";
let select = {
  id: true,
  posterId: true,
  // categoryId: true,
  // statusId: true,
  // user:{}
  isAllowBooking: true,
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
  view: true,
  coverImage: true,
  createAt: true,
  updateAt: true,
  categoryId: true,
  user: {
    select: {
      id: true,
      username: true,
      phoneNumber: true,
    },
  },
  category: {
    select: { title: true, icon: true, showHome: true },
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

      const [userExists, statsExists, categoryExists] = await Promise.all([
        FindUserById(posterId),
        FindStatusById(statusId),
        FindCategoryById(categoryId),
      ]);
      if (!userExists || !statsExists || !categoryExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            !userExists ? "user" : !statsExists ? "status" : "category"
          } with id:${
            !userExists ? posterId : !statsExists ? statusId : categoryId
          }`
        );
      }
      const dataDocImageToList = !data.images.length
        ? [data.images]
        : data.images;
      const ImagesPromise = dataDocImageToList.map((img) =>
        S3UploadImage(img).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );
      const CoverImagePromise = S3UploadImage(data.coverImage).then((url) => {
        if (!url) {
          throw new Error("Upload Image failed");
        }
        return url;
      });

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
      });
      await client.del(
        cacheKey + "-u-" + posterId,
        cacheKey + "-ct-" + categoryId
      );
      await CacheAndInsertData(cacheKey, model, where, service, select);
      SendSuccess(res, `${EMessage.insertSuccess} service`, service);
    } catch (error) {
      console.error("Error inserting service:", error);
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
      // await client.del(cacheKey + "-ct-" + serviceExists.categoryId);
      if (serviceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the service with the specified ID:${id}`
        );
      }

      if (data.view && typeof data.view !== "number")
        data.view = parseInt(data.view);
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
      if (data.posterId) userExists = results.shift();
      if (data.categoryId) categoryExists = results.shift();
      if (data.statusId) statusExists = results.shift();

      // Check if any related entities do not exist
      if (
        (data.posterId && !userExists) ||
        (data.categoryId && !categoryExists) ||
        (data.statusId && !statusExists)
      ) {
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

      // Convert prices to numbers if necessary
      if (data.priceMonth && typeof data.priceMonth !== "number") {
        data.priceMonth = parseFloat(data.priceMonth);
      }
      if (data.priceYear && typeof data.priceYear !== "number") {
        data.priceYear = parseFloat(data.priceYear);
      }
      if (data.priceCommission && typeof data.priceCommission !== "number") {
        data.priceCommission = parseFloat(data.priceCommission);
      }

      // Convert isShare to boolean if necessary
      if (data.isShare && typeof data.isShare !== "boolean") {
        data.isShare = data.isShare === "true" || data.isShare === "1";
      }

      // Update the service
      const service = await prisma.service.update({
        where: { id },
        data,
      });
      // console.log('object :>> ',  cacheKey + "-u-" + serviceExists.posterId);

      // Clear the cache
      await client.del([
        cacheKey,
        cacheKey + "-u-" + serviceExists.posterId,
        cacheKey + "-ct-" + serviceExists.categoryId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);

      // Send success response
      SendSuccess(res, `${EMessage.updateSuccess} service`, service);
    } catch (error) {
      // Handle errors
      SendErrorCatch(res, `${EMessage.updateFailed} service`, error);
    }
  },
  async UpdateView(req, res) {
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
          view: serviceExists.view + 1,
        },
      });
      await client.del([
        cacheKey,
        cacheKey + "-u-" + serviceExists.posterId,
        cacheKey + "-ct-" + serviceExists.categoryId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);

      SendSuccess(res, `${EMessage.deleteSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} service`, error);
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
      if (serviceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the service with the specified ID:${id}`
        );
      }

      const coverImage_url = await S3UploadImage(
        data.coverImage,
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
      await client.del([
        cacheKey,
        cacheKey + "-u-" + serviceExists.posterId,
        cacheKey + "-ct-" + serviceExists.categoryId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
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
      if (serviceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the service with the specified ID:${id}`
        );
      }

      const OldImageList = serviceExists.images;
      let images_url_List = CheckUniqueElement(OldImageList, oldImages);
      const ImagesPromises = dataImagesToList.map((img, i) =>
        S3UploadImage(img, oldImages[i]).then((url) => {
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
      await client.del([
        cacheKey,
        cacheKey + "-u-" + serviceExists.posterId,
        cacheKey + "-ct-" + serviceExists.categoryId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
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
      if (serviceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the service with the specified ID:${id}`
        );
      }

      const service = await prisma.service.update({
        where: { id },
        data: {
          isShare,
        },
      });
      await client.del([
        cacheKey,
        cacheKey + "-u-" + serviceExists.posterId,
        cacheKey + "-ct-" + serviceExists.categoryId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess} service `, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} service`, error);
    }
  },

  async UpdateStatusId(req, res) {
    try {
      const id = req.params.id;
      let { statusId } = req.body;
      if (!statusId) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: statusId is required`
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
      const service = await prisma.service.update({
        where: { id },
        data: {
          statusId,
        },
      });
      await client.del([
        cacheKey,
        cacheKey + "-u-" + serviceExists.posterId,
        cacheKey + "-ct-" + serviceExists.categoryId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
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
      if (serviceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the service with the specified ID:${id}`
        );
      }

      const service = await prisma.service.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await client.del([
        cacheKey,
        cacheKey + "-u-" + serviceExists.posterId,
        cacheKey + "-ct-" + serviceExists.categoryId,
      ]);
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);

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
        where,
        select
      );
      SendSuccess(res, `${EMessage.fetchAllSuccess} service`, service);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} service`, error);
    }
  },

  async SelectCategoryShowHome(req, res) {
    try {
      const isShow = req.query.isShow === "true";
      const service = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where,
        select
      );
      console.log("isShow :>> ", isShow);
      const result = service.filter(
        (i) => Boolean(i.category.showHome) === isShow
      );

      SendSuccess(res, `${EMessage.fetchAllSuccess} service`, result);
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
        cacheKey + "-u-" + userId,
        model,
        { posterId: userId, isActive: true },
        select
      );
      // console.log("object :>> ", cacheKey + "-u-" + userId);
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} service by userId`,
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

  async SelectByCategoryId(req, res) {
    try {
      const categoryId = req.params.categoryId;
      const service = await CacheAndRetrieveUpdatedData(
        cacheKey + "-ct-" + categoryId,
        model,
        { categoryId, isActive: true },
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} service by categoryId`,
        service
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} service by categoryId`,
        error
      );
    }
  },

  async SelectByShare(req, res) {
    try {
      const isShareParam = req.params.isShare === "true"; // Convert param to boolean

      // Retrieve cached data or query the database
      const data = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where,
        select
      );

      // Filter the data based on the isShare parameter
      const service = data.filter((item) => item.isShare === isShareParam);

      console.log("Filtered services by isShare:", service);

      // Send the filtered services as a response
      SendSuccess(res, `${EMessage.fetchAllSuccess} by isShare`, service);
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.searchsuccessFailed} service by isShare`,
        error
      );
    }
  },
  async SearchAddress(req, res) {
    try {
      const search = req.query.search;

      // Construct the query for searching
      const searchConditions = {
        isActive: true,
        OR: [
          { village: { contains: search, mode: "insensitive" } },
          { district: { contains: search, mode: "insensitive" } },
          { province: { contains: search, mode: "insensitive" } },
        ],
      };

      // Search and retrieve data, with caching
      const service = await CacheAndRetrieveUpdatedData(
        cacheKey + "-address-" + encodeURIComponent(search), // Sanitize cache key
        model,
        searchConditions,
        select
      );

      // Send success response
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} services matching search query`,
        service
      );
    } catch (error) {
      // Handle errors
      SendErrorCatch(
        res,
        `${EMessage.searchFailed} services matching search query`,
        error
      );
    }
  },
  async Search(req, res) {
    try {
      const search = req.query.search;

      // Construct the query for searching
      const searchConditions = {
        isActive: true,
        name: { contains: search, mode: "insensitive" },
      };

      // Search and retrieve data, with caching
      const service = await CacheAndRetrieveUpdatedData(
        cacheKey + "-s-" + encodeURIComponent(search), // Sanitize cache key
        model,
        searchConditions,
        select
      );

      // Send success response
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} services matching search query`,
        service
      );
    } catch (error) {
      // Handle errors
      SendErrorCatch(
        res,
        `${EMessage.searchFailed} services matching search query`,
        error
      );
    }
  },

  async SelectByPriceRange(req, res) {
    try {
      // Extract and validate query parameters
      const { minPrice, maxPrice } = req.query;
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);

      // Validate min and max prices
      if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
        return SendErrorCatch(res, "Invalid price range provided");
      }

      // Construct search conditions
      const searchConditions = {
        isActive: true,
        OR: [
          { AND: [{ priceMonth: { gte: min } }, { priceMonth: { lte: max } }] },
          { AND: [{ priceYear: { gte: min } }, { priceYear: { lte: max } }] },
        ],
      };

      // Define cache key (consider hashing or encoding for safety)
      const cacheKey = `services-by-price-${min}-${max}`;
      const service = await CacheAndRetrieveUpdatedData(
        cacheKey, // Simplified cache key
        model,
        searchConditions,
        select // Ensure 'select' is defined or passed properly
      );

      // Send success response
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} services matching search query`,
        service
      );
    } catch (error) {
      // Send error response
      SendErrorCatch(
        res,
        `${EMessage.searchFailed} services by price range`,
        error
      );
    }
  },
};
export default ServiceController;
