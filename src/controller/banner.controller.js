import redis from "../Database/radis.js"; // Ensure correct path and module name
import { EMessage } from "../service/enum.js";
import { FindBannerById } from "../service/find.js";
import {
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { UploadImage } from "../service/uploadImage.js";
import { DataExist } from "../service/validate.js";
import prisma from "../util/Prisma.js";
let cacheKey = "banners";
const BannerController = {
  async Insert(req, res) {
    try {
      const { link_url } = req.body;
      const data = req.files;

      if (!link_url)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: link_url is required`
        );
      if (!data)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: image is required`
        );

      const img_url = await UploadImage(data.image.data);
      if (!img_url) return SendError(res, 400, `Upload Image failed`);

      const banner = await prisma.banner.create({
        data: {
          link_url,
          image: img_url,
        },
      });

      const cachedData = await redis.get(cacheKey);
      if (!cachedData) {
        const banners = await prisma.banner.findMany({
          where: { isActive: true },
          orderBy: {
            createAt: "desc",
          },
        });
        await redis.set(cacheKey, JSON.stringify(banners), "EX", 3600);
      } else {
        const banners = JSON.parse(cachedData);
        banners.unshift(banner);
        await redis.set(cacheKey, JSON.stringify(banners), "EX", 3600);
      }
       await redis.del( "banners-isPublice");

      return SendCreate(res, `${EMessage.insertSuccess}`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.insertFailed} banner`, error);
    }
  },

  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);
      const bannerExists = await FindBannerById(id);
      console.log("data :>> ", data);
      if (!bannerExists)
        return SendError(res, 404, `${EMessage.notFound} banner with id ${id}`);

      const banner = await prisma.banner.update({
        where: {
          id,
        },
        data,
      });
      let cacheKeyID = cacheKey + "_" + id;
      await redis.del(cacheKey, cacheKeyID, "banners-isPublice");

      return SendSuccess(res, `${EMessage.updateSuccess}`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.updateFailed} banner`, error);
    }
  },

  async UpdateisPublice(req, res) {
    try {
      const id = req.params.id;
      const status = req.body.status;

      if (!status)
        return SendError(res, 400, `${EMessage.pleaseInput}: status`);

      const bannerExists = await FindBannerById(id);
      if (!bannerExists)
        return SendError(res, 404, `${EMessage.notFound} banner with id ${id}`);

      const banner = await prisma.banner.update({
        where: { id },
        data: { isPublice: status },
      });
      let cacheKeyID = cacheKey + "_" + id;
      await redis.del(cacheKey, cacheKeyID);
      return SendSuccess(res, `${EMessage.updateSuccess}`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.updateFailed} banner`, error);
    }
  },

  async UpdateImage(req, res) {
    try {
      const id = req.params.id;
      const { oldImage } = req.body;
      const data = req.files;

      if (!oldImage)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: oldImage is required`
        );
      if (!data)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: image is required`
        );

      const bannerExists = await FindBannerById(id);
      if (!bannerExists)
        return SendError(res, 404, `${EMessage.notFound} banner with id ${id}`);

      const img_url = await UploadImage(data.image.data);
      if (!img_url) return SendError(res, 400, `Upload Image failed`);

      const banner = await prisma.banner.update({
        where: { id },
        data: { image: img_url },
      });
      let cacheKeyID = cacheKey + "_" + id;
      await redis.del(cacheKey, cacheKeyID, "banners-isPublice");

      return SendSuccess(res, `${EMessage.updateSuccess} image banner`, banner);
    } catch (error) {
      return SendErrorCatch(
        res,
        `${EMessage.updateFailed} image banner`,
        error
      );
    }
  },

  async Delete(req, res) {
    try {
      const id = req.params.id;
      const bannerExists = await FindBannerById(id);

      if (!bannerExists)
        return SendError(res, 404, `${EMessage.notFound} banner with id ${id}`);

      const banner = await prisma.banner.update({
        where: { id },
        data: { isActive: false },
      });
      // delete cached redis  banners and banners_id
      let cacheKeyID = cacheKey + "_" + id;
      await redis.del(cacheKey, cacheKeyID, "banners-isPublice");

      return SendSuccess(res, `${EMessage.deleteSuccess} banner`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.deleteFailed} banner`, error);
    }
  },

  async SelAll(req, res) {
    try {
      let bannerData;

      const cachedData = await redis.get(cacheKey);
      // await redis.del(cacheKey);
      if (!cachedData) {
        bannerData = await prisma.banner.findMany({
          where: { isActive: true },
          orderBy: { createAt: "desc" },
        });
        await redis.set(cacheKey, JSON.stringify(bannerData), "EX", 3600);
        console.log("object :>> ", JSON.parse(cachedData));
      } else {
        bannerData = JSON.parse(cachedData);
      }

      return SendSuccess(res, `${EMessage.fetchAllSuccess}`, bannerData);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingAll} banner`, error);
    }
  },

  async SelOne(req, res) {
    try {
      const id = req.params.id;
      let cacheKeyID = cacheKey + "_" + id;
      const cachedData = await redis.get(cacheKeyID);
      let banner;
      if (!cachedData) {
        banner = await FindBannerById(id);
        if (!banner)
          return SendError(
            res,
            404,
            `${EMessage.notFound} banner with id ${id}`
          );
        await redis.set(cacheKeyID, JSON.stringify(banner), "EX", 3600);
      } else {
        banner = JSON.parse(cachedData);
      }

      return SendSuccess(res, `${EMessage.fetchOneSuccess}`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingOne} banner`, error);
    }
  },

  async SelByIsPublice(req, res) {
    try {
      const cacheKey = "banners-isPublice";
      const cachedData = await redis.get(cacheKey);

      if (!cachedData) {
        const banner = await prisma.banner.findMany({
          where: {
            isActive: true,
            isPublice: true,
          },
          orderBy: { createAt: "desc" },
        });
        await redis.set(cacheKey, JSON.stringify(banner), "EX", 3600);
        return SendSuccess(
          res,
          "Successfully fetched isPublic records banner",
          banner
        );
      }

      return SendSuccess(
        res,
        "Successfully fetched isPublic records banner",
        JSON.parse(cachedData)
      );
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingAll} banner`, error);
    }
  },
};

export default BannerController;
