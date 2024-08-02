import { EMessage } from "../service/enum.js";
import { FindCategoryById } from "../service/find.js";
import { SendCreate, SendErrorCatch } from "../service/service.js";
import { UploadImage } from "../service/uploadImage.js";
import { DataExist, ValidateCategory } from "../service/validate.js";
import prisma from "../util/Prisma.js";

const CategoryController = {
  async Insert(req, res) {
    try {
      const validate = ValidateCategory(req.body);
      const { title } = req.body;
      const data = req.files;

      if (!validate)
        if (validate.length > 0) {
          return SendError(
            res,
            400,
            `${EMessage.pleaseInput}: ${validate.join(", ")}`
          );
        }

      if (!data) return SendError(res, 400, `${EMessage.pleaseInput}: image}`);

      const img_url = await UploadImage(data.image.data);
      const category = await prisma.category.create({
        data: {
          title,
          icon: img_url,
        },
      });
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
      return SendCreate(res, `${EMessage.updateSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed}`, error);
    }
  },
  async UpdateImage(req, res) {
    try {
      const id = req.params.id;
      const data = req.files;
      if (!data) return SendError(res, 400, `${EMessage.pleaseInput}: image}`);
      const categoryExists = await FindCategoryById(id);
      if (!categoryExists)
        return SendError(res, 404, `${EMessage.notFound} category by id ${id}`);
      const img_url = await UploadImage(data.image.data);
      const category = await prisma.category.update({
        where: {
          id,
        },
        data: {
          icon: img_url,
        },
      });
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
      return SendCreate(res, `${EMessage.deleteSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed}`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      const category = await prisma.category.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createAt: "desc",
        },
      });
      return SendCreate(res, `${EMessage.fetchAllSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll}`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      const id = req.params.id;
      const categoryExists = await FindCategoryById(id);
      if (!categoryExists)
        return SendError(res, 404, `${EMessage.notFound} category by id ${id}`);
      return SendCreate(res, `${EMessage.fetchOneSuccess}`, category);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne}`, error);
    }
  },
};
export default CategoryController;
