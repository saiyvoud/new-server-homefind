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
  FindotherServiceById,
  FindUserById,
} from "../service/find.js";
import { DeleteCachedKey } from "../service/cach.deletekey.js";
let cacheKey = "otherService";
let where = { isActive: true };
const model = "otherService";
let select = {
  id: true,
  posterId: true,
  name: true,
  village: true,
  district: true,
  province: true,
  detail: true,
  phoneNumber: true,
  view: true,
  coverImage: true,
  images: true,
  createAt: true,
  updateAt: true,
  categoryId: true,
  user: {
    select: {
      username: true,
      phoneNumber: true,
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

const OtherServiceController = {
  async Insert(req, res) {
    try {
      let {
        name,
        posterId,
        categoryId,
        village,
        district,
        province,
        detail,
        phoneNumber,
      } = req.body;
      const validate = validateData({
        name,
        posterId,
        categoryId,
        village,
        district,
        province,
        detail,
        phoneNumber,
      });

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

      if (validate.length > 0)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(",")}`
        );

      const [userExists, categoryExists] = await Promise.all([
        FindUserById(posterId),
        FindCategoryById(categoryId),
      ]);
      if (!userExists || !categoryExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${!userExists ? "user" : "category"} with id:${
            !userExists ? posterId : categoryId
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

      const otherService = await prisma.otherService.create({
        data: {
          name,
          posterId,
          categoryId,
          village,
          district,
          province,
          detail,
          phoneNumber,
          images: images_url_list,
          coverImage: coverImage_url,
        },
      });
      await ReFreshCashData({
        keyCt: categoryId + cacheKey,
        keyUser: posterId + cacheKey,
      });

      await CacheAndInsertData(cacheKey, model, where, otherService, select);
      SendSuccess(res, `${EMessage.insertSuccess} otherService`, otherService);
    } catch (err) {
      return SendErrorCatch(res, `${EMessage.insertFailed} otherService`, err);
    }
  },

  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);

      const otherServiceExists = await FindotherServiceById(id);
      if (!otherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherService with id: ${id}`
        );
      }
      // if (otherServiceExists.posterId !== req.user && req.role === "user") {
      //   return SendError(
      //     res,
      //     404,
      //     `You do not have ownership of the otherService with the specified ID:${id}`
      //   );
      // }
      if (data.view && typeof data.view !== "number")
        data.view = parseInt(data.view);
      // Convert prices to numbers if necessary

      const promiseList = [];
      if (data.posterId) {
        promiseList.push(FindUserById(data.posterId));
      }
      if (data.categoryId) {
        promiseList.push(FindCategoryById(data.categoryId));
      }

      // Resolve all promises
      const results = await Promise.all(promiseList);
      let userExists, categoryExists;
      if (data.posterId) userExists = results.shift();
      if (data.categoryId) categoryExists = results.shift();

      // Check if any related entities do not exist
      if (
        (data.posterId && !userExists) ||
        (data.categoryId && !categoryExists)
      ) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} ${
            data.posterId && !userExists ? "user" : "category"
          } with id: ${
            data.posterId && !userExists ? data.posterId : data.categoryId
          }`
        );
      }

      const otherService = await prisma.otherService.update({
        where: { id },
        data,
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: otherServiceExists.categoryId + cacheKey,
        keyUser: otherServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess} service`, otherService);
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} otherService`,
        error
      );
    }
  },
  async UpdateView(req, res) {
    try {
      const id = req.params.id;
      const otherServiceExists = await FindotherServiceById(id);

      if (!otherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherService with id:${id}`
        );
      }

      const otherService = await prisma.otherService.update({
        where: { id },
        data: {
          view: otherServiceExists.view + 1,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: otherServiceExists.categoryId + cacheKey,
        keyUser: otherServiceExists.posterId + cacheKey,
      });

      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} otherService`,
        otherService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} otherService`,
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
      const otherServiceExists = await FindotherServiceById(id);
      if (!otherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherService with id: ${id}`
        );
      }
      if (otherServiceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the otherService with the specified ID:${id}`
        );
      }
      const coverImage_url = await S3UploadImage(
        coverImage,
        old_coverImage
      ).then((url) => {
        if (!url) throw new Error("Upload image failed");
        return url;
      });

      const otherService = await prisma.otherService.update({
        where: { id },
        data: { coverImage: coverImage_url },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: otherServiceExists.categoryId + cacheKey,
        keyUser: otherServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} coverImage otherService`,
        otherService
      );
    } catch (err) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} coverImage otherService`,
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
      const otherServiceExists = await FindotherServiceById(id);
      if (!otherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherService with id: ${id}`
        );
      }
      if (otherServiceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the otherService with the specified ID:${id}`
        );
      }
      const OldImageList = otherServiceExists.images;
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

      const otherService = await prisma.otherService.update({
        where: { id },
        data: {
          images: images_url_List,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: otherServiceExists.categoryId + cacheKey,
        keyUser: otherServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.updateSuccess} images otherService`,
        otherService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} images otherService`,
        error
      );
    }
  },

  async Delete(req, res) {
    try {
      const id = req.params.id;
      const otherServiceExists = await FindotherServiceById(id);
      if (!otherServiceExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherService with id: ${id}`
        );
      }
      if (otherServiceExists.posterId !== req.user && req.role === "user") {
        return SendError(
          res,
          404,
          `You do not have ownership of the otherService with the specified ID:${id}`
        );
      }

      const otherService = await prisma.otherService.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await ReFreshCashData({
        key: cacheKey,
        keyCt: otherServiceExists.categoryId + cacheKey,
        keyUser: otherServiceExists.posterId + cacheKey,
      });
      await CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      return SendSuccess(
        res,
        `${EMessage.deleteSuccess} otherService`,
        otherService
      );
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.deleteFailed}  otherService`,
        error
      );
    }
  },
  async SelectAll(req, res) {
    try {
      const otherService = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where,
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} otherService`,
        otherService
      );
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} otherService`, error);
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
      const otherService = await CacheAndRetrieveUpdatedData(
        cacheKey + "Rc",
        model,
        whereRecommend,
        select
      );

      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} otherService`,
        otherService
      );
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} otherService`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const otherService = await FindotherServiceById(id);
      if (!otherService) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} otherService with id: ${id}`
        );
      }
      SendSuccess(
        res,
        `${EMessage.fetchOneSuccess} otherService`,
        otherService
      );
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} otherService`, error);
    }
  },

  async SelectByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const otherService = await CacheAndRetrieveUpdatedData(
        userId + cacheKey,
        model,
        { posterId: userId, isActive: true },
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} otherService by userId`,
        otherService
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} otherService by userId`,
        error
      );
    }
  },
  async SelectByCategoryId(req, res) {
    try {
      const categoryId = req.params.categoryId;
      const otherService = await CacheAndRetrieveUpdatedData(
        categoryId + cacheKey,
        model,
        { categoryId, isActive: true },
        select
      );
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} otherService by categoryId`,
        otherService
      );
    } catch (error) {
      SendErrorCatch(
        res,
        `${EMessage.errorFetchingAll} otherService by categoryId`,
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
      const otherService = await CacheAndRetrieveUpdatedData(
        cacheKey + "-address-" + encodeURIComponent(search), // Sanitize cache key
        model,
        searchConditions,
        select
      );

      // Send success response
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} otherService matching search query`,
        otherService
      );
    } catch (error) {
      // Handle errors
      SendErrorCatch(
        res,
        `${EMessage.searchFailed} otherService matching search query`,
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
      const otherService = await CacheAndRetrieveUpdatedData(
        cacheKey + "-s-" + encodeURIComponent(search), // Sanitize cache key
        model,
        searchConditions,
        select
      );

      // Send success response
      SendSuccess(
        res,
        `${EMessage.fetchAllSuccess} otherService matching search query`,
        otherService
      );
    } catch (error) {
      // Handle errors
      SendErrorCatch(
        res,
        `${EMessage.searchFailed} otherService matching search query`,
        error
      );
    }
  },
};
export default OtherServiceController;
