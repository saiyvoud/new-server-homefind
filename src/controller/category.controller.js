import client from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import { FindCategoryById } from "../service/find.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { UploadImage } from "../service/uploadImage.js";
import { DataExist, ValidateCategory } from "../service/validate.js";
import prisma from "../util/prismaClient.js";

let cacheKey = "categorys";
const model = "category";
let select;
let where = { isActive: true };
const CategoryController = {
  async Insert(req, res) {
    try {
      const validate = ValidateCategory(req.body);
      const { title } = req.body;
      const data = req.files;

      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }

      if (!data || !data.icon) {
        return SendError(res, 400, `${EMessage.pleaseInput}: icon is required`);
      }

      const img_url = await UploadImage(data.icon.data);
      const category = await prisma.category.create({
        data: {
          title,
          icon: img_url,
        },
      });
      await CacheAndInsertData(cacheKey, model, where, category);
      return SendCreate(res, `${EMessage.insertSuccess}`, category);
    } catch (error) {
      return SendErrorCatch(res, `${EMessage.insertFailed}`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.params.id;
      const data = DataExist(req.body);
      const categoryExists = await FindCategoryById(id);
      if (!categoryExists)
        return SendError(res, 404, `${EMessage.notFound} category by id ${id}`);
      const category = await prisma.category.update({
        where: {
          id,
        },
        data,
      });
      await client.del(cacheKey);
      await   CacheAndRetrieveUpdatedData(cacheKey, model, where);
      return SendCreate(res, `${EMessage.updateSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed}`, error);
    }
  },
  async UpdateImage(req, res) {
    try {
      const id = req.params.id;
      const { oldIcon } = req.body;
      const data = req.files;

      if (!oldIcon) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldIcon`);
      }
      if (!data || !data.icon)
        return SendError(res, 400, `${EMessage.pleaseInput}: icon`);
      const categoryExists = await FindCategoryById(id);
      if (!categoryExists)
        return SendError(res, 404, `${EMessage.notFound} category by id ${id}`);
      const img_url = await UploadImage(data.icon.data, oldIcon);
      const category = await prisma.category.update({
        where: {
          id,
        },
        data: {
          icon: img_url,
        },
      });
      await client.del(cacheKey);
      await  CacheAndRetrieveUpdatedData(cacheKey, model, where);
      return SendCreate(res, `${EMessage.updateSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed}`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const categoryExists = await FindCategoryById(id);
      if (!categoryExists)
        return SendError(res, 404, `${EMessage.notFound} category by id ${id}`);
      const category = await prisma.category.update({
        where: {
          id,
        },
        data: {
          isActive: false,
        },
      });
      await client.del(cacheKey);
      await  CacheAndRetrieveUpdatedData(cacheKey, model, where);
      return SendCreate(res, `${EMessage.deleteSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed}`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const category = await CacheAndRetrieveUpdatedData(
        cacheKey,
        model,
        where
      );
      console.log("all category", category);
      return SendCreate(res, `${EMessage.fetchAllSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll}`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const category = await FindCategoryById(id);
      if (!category)
        return SendError(res, 404, `${EMessage.notFound} category by id ${id}`);
      return SendCreate(res, `${EMessage.fetchOneSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne}`, error);
    }
  },

  async Search(req, res) {
    try {
      const search = req.query.search;
      const cachedData = await client.get(cacheKey + search);
      let results;
      if (!cachedData) {
        const category = await prisma.category.findMany({
          where: {
            isActive: true,
            title: { contains: search },
          },
          orderBy: {
            createAt: "desc",
          },
        });
        const count = await prisma.category.count({
          where: {
            isActive: true,
            title: { contains: search },
          },
          orderBy: {
            createAt: "desc",
          },
        });
        results = {
          count,
          category,
        };
        await client.set(
          cacheKey + search,
          JSON.stringify(results),
          "EX",
          1800
        );
      } else {
        results = JSON.parse(cachedData);
      }
      SendSuccess(res, `${EMessage.searchsuccess}`, results);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne}`, error);
    }
  },
};
export default CategoryController;
