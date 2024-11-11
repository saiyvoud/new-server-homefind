import { currencyType } from "@prisma/client";
import { EMessage } from "../service/enum.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  CheckUniqueElement,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { DataExist, validateData } from "../service/validate.js";
import prisma from "../util/prismaClient.js";
import { S3UploadImage } from "../service/s3UploadImage.js";
import {
  FindCategoryById,
  FindSaleServiceById,
  FindStatusById,
  FindUserById,
} from "../service/find.js";
import { DeleteCachedKey } from "../service/cach.deletekey.js";
import { LIMITED_POST_SALES_SERVICES } from "../config/api.config.js";
let cacheKey = "saleService";
let where = { isActive: true };
const model = "saleService";
let select = {
  id: true,
  posterId: true,
  name: true,
  village: true,
  district: true,
  province: true,
  price: true,
  detail: true,
  images: true,
  phoneNumber: true,
  view: true,
  coverImage: true,
  createAt: true,
  updateAt: true,
  categoryId: true,
  user: {
    select: {
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

const ReFreshCashData = async ({ key, keyCt, keyUser }) => {
  const promise = [];
  if (key) DeleteCachedKey(key);
  if (keyCt) DeleteCachedKey(keyCt);
  if (keyUser) DeleteCachedKey(keyUser);
  await Promise.all(promise);
};

const SaleServiceController = {
  async Insert(req, res) {
    try {
      let {
        name,
        posterId,
        categoryId,
        village,
        district,
        province,
        price,
        currency,
        detail,
        phoneNumber,
        statusId,
      } = req.body;
      const validate = validateData({
        name,
        posterId,
        categoryId,
        village,
        district,
        province,
        price,
        phoneNumber,
        currency,
        detail,
        statusId,
      });
      const role = req.role;
      
      const userCount = await CacheAndRetrieveUpdatedData(
        posterId + cacheKey,
        model,
        { posterId: posterId, isActive: true },
        select
      );
      if (userCount.length > LIMITED_POST_SALES_SERVICES&& role === "user") {
        return SendError(
          res,
          400,
          `Please upgrade your account to post sale service more `
        );
      }

      const coverImage = req?.files?.coverImage;
      const images = req?.files?.images;
      if (!images || !coverImage) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${
            !images && !coverImage
              ? "images, coverImage"
              : !images
              ? "images"
              : "coverImage"
          }`
        );
      }
      if (typeof price !== "number") {
        price = parseFloat(price);
      }
      if (validate.length > 0)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(",")}`
        );
      if (!Object.keys(currencyType).includes(currency)) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${Object.keys(currencyType).join(",")}`
        );
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
      const dataDocImageToList = !images.length ? [images] : images;
      const ImagesPromise = dataDocImageToList.map((img) =>
        S3UploadImage(img).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );
      const CoverImagePromise = S3UploadImage(coverImage).then((url) => {
        if (!url) {
          throw new Error("Upload Image failed");
        }
        return url;
      });

      const [coverImage_url, images_url_list] = await Promise.all([
        CoverImagePromise,
        Promise.all(ImagesPromise),
      ]);

      const saleService = await prisma.saleService.create({
        data: {
          name,
          posterId,
          categoryId,
          village,
          district,
          province,
          price,
          currency,
          detail,
          phoneNumber,
          statusId,
          images: images_url_list,
          coverImage: coverImage_url,
        },
      });
      await ReFreshCashData({
        keyCt: categoryId + cacheKey,
        keyUser: posterId + cacheKey,
      });

      await CacheAndInsertData(cacheKey, model, where, saleService, select);
      SendSuccess(res, `${EMessage.insertSuccess} saleService`, saleService);
    } catch (err) {
      return SendErrorCatch(res, `${EMessage.insertFailed} saleService`, err);
    }
  },

  
  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);

      if (data.currency && !Object.keys(currencyType).includes(data.currency)) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${Object.keys(currencyType).join(",")}`
        );
      }
      const saleServiceExists = await FindSaleServiceById(id);
      if (!saleServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} saleService with id: ${id}`
        );
      }
      if (saleServiceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the saleService with the specified ID:${id}`
        );
      }
      if (data.view && typeof data.view !== "number")
        data.view = parseInt(data.view);
      // Convert prices to numbers if necessary
      if (data.price && typeof data.price !== "number") {
        data.price = parseFloat(data.price);
      }

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

      const saleservice = await prisma.saleService.update({
        where: { id },
        data,
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: saleServiceExists.categoryId + cacheKey,
        keyUser: saleServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess} service`, saleservice);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.updateFailed} saleService`, error);
    }
  },
  async UpdateView(req, res) {
    try {
      const id = req.params.id;
      const saleServiceExists = await FindSaleServiceById(id);

      if (!saleServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} saleService with id:${id}`
        );
      }

      const saleService = await prisma.saleService.update({
        where: { id },
        data: {
          view: saleServiceExists.view + 1,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: saleServiceExists.categoryId + cacheKey,
        keyUser: saleServiceExists.posterId + cacheKey,
      });

      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} saleService`,
        saleService
      );
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.updateFailed} saleService`, error);
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
      const saleServiceExists = await FindSaleServiceById(id);
      if (!saleServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} saleService with id: ${id}`
        );
      }
      if (saleServiceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the saleService with the specified ID:${id}`
        );
      }
      const coverImage_url = await S3UploadImage(
        coverImage,
        old_coverImage
      ).then((url) => {
        if (!url) throw new Error("Upload image failed");
        return url;
      });

      const saleService = await prisma.saleService.update({
        where: { id },
        data: { coverImage: coverImage_url },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: saleServiceExists.categoryId + cacheKey,
        keyUser: saleServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} coverImage saleService`,
        saleService
      );
    } catch (err) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} coverImage saleService`,
        err
      );
    }
  },

  async UpdateImages(req, res) {
    try {
      const id = req.params.id;
      const images = req.files?.images;
      let { oldImages } = req.body;
      if (!oldImages) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldImages`);
      }
      oldImages = oldImages.split(",");
      if (oldImages.length === 0) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldImages`);
      }
      const dataImagesToList = !images.length ? [images] : images;

      if (dataImagesToList.length !== oldImages.length) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: The number of provided docImage files does not match the existing records. Please ensure you have uploaded the correct number of images.`
        );
      }
      const saleServiceExists = await FindSaleServiceById(id);
      if (!saleServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} saleService with id: ${id}`
        );
      }
      if (saleServiceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the saleService with the specified ID:${id}`
        );
      }
      const OldImageList = saleServiceExists.images;
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

      const saleService = await prisma.saleService.update({
        where: { id },
        data: {
          images: images_url_List,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: saleServiceExists.categoryId + cacheKey,
        keyUser: saleServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} images saleService`,
        saleService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} images saleService`,
        error
      );
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

      const [saleServiceExists, statsExists] = await Promise.all([
        FindSaleServiceById(id),
        FindStatusById(statusId),
      ]);
      if (!saleServiceExists || !statsExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            !saleServiceExists ? "saleService" : "status"
          } with id: ${!saleServiceExists ? id : statusId}`
        );
      }
      const saleService = await prisma.service.update({
        where: { id },
        data: {
          statusId,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: saleServiceExists.categoryId + cacheKey,
        keyUser: saleServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} status saleService`,
        saleService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} status saleService`,
        error
      );
    }
  },

  async Delete(req, res) {
    try {
      const id = req.params.id;
      const saleServiceExists = await FindSaleServiceById(id);
      if (!saleServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} saleService with id: ${id}`
        );
      }
      if (saleServiceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the saleService with the specified ID:${id}`
        );
      }

      const saleService = await prisma.saleService.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: saleServiceExists.categoryId + cacheKey,
        keyUser: saleServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.deleteSuccess} saleService`,
        saleService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.deleteFailed}  saleService`,
        error
      );
    }
  },
  async SelectAll(req, res) {
    try {
      const saleService = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where,
        select
      );
      SendSuccess(res, `${EMessage.fetchAllSuccess} saleService`, saleService);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} saleService`, error);
    }
  },
  async SelectRecommend(req, res) {
    try {
      const whereRecommend = {
        ...where,
        user: {
          OR: [
            {
              role: "admin",
            },
            {
              role: "superadmin",
            },
          ],
        },
      };
      const saleService = await CacheAndRetrieveUpdatedData(
        cacheKey + "Rc",
        model,
        whereRecommend,
        select
      );

      SendSuccess(res, `${EMessage.fetchAllSuccess} saleService`, saleService);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} saleService`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const saleService = await FindSaleServiceById(id);
      if (!saleService) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} saleService with id: ${id}`
        );
      }
      SendSuccess(res, `${EMessage.fetchOneSuccess} saleService`, saleService);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} saleService`, error);
    }
  },

  async SelectByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const saleService = await CacheAndRetrieveUpdatedData(
        userId + cacheKey,
        model,
        { posterId: userId, isActive: true },
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} saleService by userId`,
        saleService
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} saleService by userId`,
        error
      );
    }
  },
  async SelectByCategoryId(req, res) {
    try {
      const categoryId = req.params.categoryId;
      const saleService = await CacheAndRetrieveUpdatedData(
        categoryId + cacheKey,
        model,
        { categoryId, isActive: true },
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} saleService by categoryId`,
        saleService
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} saleService by categoryId`,
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
      const saleService = await CacheAndRetrieveUpdatedData(
        cacheKey + "-address-" + encodeURIComponent(search), // Sanitize cache key
        model,
        searchConditions,
        select
      );

      // Send success response
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} saleServices matching search query`,
        saleService
      );
    } catch (error) {
      // Handle errors
      SendErrorCatch(
        res,
        `${EMessage.searchFailed} saleServices matching search query`,
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
      const saleService = await CacheAndRetrieveUpdatedData(
        cacheKey + "-s-" + encodeURIComponent(search), // Sanitize cache key
        model,
        searchConditions,
        select
      );

      // Send success response
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} saleServices matching search query`,
        saleService
      );
    } catch (error) {
      // Handle errors
      SendErrorCatch(
        res,
        `${EMessage.searchFailed} saleServices matching search query`,
        error
      );
    }
  },
};
export default SaleServiceController;
