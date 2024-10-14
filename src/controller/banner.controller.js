import client from "../Database/radis.js"; // Ensure correct path and module name
import { EMessage } from "../service/enum.js";
import { FindBannerById } from "../service/find.js";
import { S3UploadImage } from "../service/s3UploadImage.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";

import { DataExist, ValidateBanner } from "../service/validate.js";
import prisma from "../util/prismaClient.js";
let cacheKey = "banners";
const model = "banner";
let select;
let where = { isActive: true };
const BannerController = {
  async Insert(req, res) {
    try {
      const validate = ValidateBanner(req.body);
      const { link_url, name, isPublic } = req.body;
      const data = req.files;

      console.log("body :>> ", req.body);

      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }
      if (!data)
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: image is required`
        );

      const img_url = await S3UploadImage(data.image);
      if (!img_url) return SendError(res, 400, `Upload Image failed`);

      const banner = await prisma.banner.create({
        data: {
          link_url,
          image: img_url,
          name,
          isPublic: isPublic == "true" ? true : false,
        },
      });

      await CacheAndInsertData(cacheKey, model, where, banner);
      await client.del(cacheKey + "-IsPublice");

      return SendCreate(res, `${EMessage.insertSuccess}`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.insertFailed} banner`, error);
    }
  },

  async Update(req, res) {
    try {
      const id = req.params.id;
      const { link_url, name, isPublic } = DataExist(req.body);
      const bannerExists = await FindBannerById(id);

      if (!bannerExists)
        return SendError(res, 404, `${EMessage.notFound} banner with id ${id}`);

      const banner = await prisma.banner.update({
        where: {
          id,
        },
        data: {
          link_url,
          name,
          isPublic: isPublic == "true" ? true : false,
        },
      });
      await client.del(cacheKey, cacheKey + "-IsPublice");
      await CacheAndRetrieveUpdatedData(cacheKey, model, where);
      return SendSuccess(res, `${EMessage.updateSuccess}`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.updateFailed} banner`, error);
    }
  },

  async UpdateisPublice(req, res) {
    try {
      const id = req.params.id;
      const isPublic = req.body.isPublic;

      const bannerExists = await FindBannerById(id);
      if (!bannerExists)
        return SendError(res, 404, `${EMessage.notFound} banner with id ${id}`);

      const banner = await prisma.banner.update({
        where: { id },
        data: { isPublic: isPublic == "true" ? true : false },
      });
      await client.del(cacheKey, cacheKey + "-IsPublice");
      await CacheAndRetrieveUpdatedData(cacheKey, model, where);

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

      const img_url = await S3UploadImage(data.image, oldImage);
      if (!img_url) return SendError(res, 400, `Upload Image failed`);

      const banner = await prisma.banner.update({
        where: { id },
        data: { image: img_url },
      });

      await client.del(cacheKey, cacheKey + "-IsPublice");
      await CacheAndRetrieveUpdatedData(cacheKey, model, where);
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
      // delete cached client  banners and banners_id
      await client.del(cacheKey, cacheKey + "-IsPublice");
      await CacheAndRetrieveUpdatedData(cacheKey, model, where);
      return SendSuccess(res, `${EMessage.deleteSuccess} banner`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.deleteFailed} banner`, error);
    }
  },

  async SelAll(req, res) {
    try {
      let bannerData = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where
      );
      return SendSuccess(res, `${EMessage.fetchAllSuccess}`, bannerData);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingAll} banner`, error);
    }
  },

  async SelOne(req, res) {
    try {
      const id = req.params.id;
      let banner = await FindBannerById(id);
      if (!banner)
        return SendError(res, 404, `${EMessage.notFound} banner with id ${id}`);
      return SendSuccess(res, `${EMessage.fetchOneSuccess}`, banner);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingOne} banner`, error);
    }
  },

  async SelByIsPublice(req, res) {
    try {
      cacheKey = cacheKey + "-IsPublice";

      let banner = await CacheAndRetrieveUpdatedData(cacheKey, model, {
        isActive: true,
        isPublic: true,
      });

      return SendSuccess(
        res,
        "Successfully fetched isPublic records banner",
        banner
      );
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.errorFetchingAll} banner`, error);
    }
  },
};

export default BannerController;
