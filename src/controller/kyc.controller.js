import client from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import { FindKYCById, FindUserById } from "../service/find.js";
import { S3UploadImage } from "../service/s3UploadImage.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  CheckUniqueElement,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";

import { DataExist, ValidateKYC } from "../service/validate.js";
import prisma from "../util/prismaClient.js";

let cacheKey = "kycs";
let model = "kyc";
let where = { isActive: true };
let select;
const KYCController = {
  async Insert(req, res) {
    try {
      const validate = ValidateKYC(req.body);
      if (validate.length > 0) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${validate.join(", ")}`
        );
      }

      let {
        userId,
        firstname,
        lastname,
        age,
        village,
        district,
        province,
        docType,
        docNo,
      } = req.body;

      const data = req.files;

      if (typeof age !== "number") {
        age = parseInt(age);
      }

      if (!data || !data.docImage || !data.profile) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: ${
            !data
              ? "docImage, profile"
              : !data.docImage
              ? "docImage"
              : "profile"
          }`
        );
      }

      const userExists = await FindUserById(userId);
      if (!userExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} user with id: ${userId}`
        );
      }
      const dataDocImageToList = !data.docImage.length
      ? [data.docImage]
      : data.docImage;

      // Create an array of promises for document image uploads
      const docImagePromises = dataDocImageToList.map((image) =>
        S3UploadImage(image).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );

      // Add the profile image upload promise to the array
      const profilePromise = S3UploadImage(data.profile).then((url) => {
        if (!url) {
          throw new Error("Upload Image failed");
        }
        return url;
      });

      // Wait for all promises to resolve
      const [docImage_url_list, profile_url] = await Promise.all([
        Promise.all(docImagePromises), // Resolves to an array of docImage URLs
        profilePromise, // Resolves to the profile URL
      ]);

      // Save KYC data to the database
      const kyc = await prisma.kyc.create({
        data: {
          userId,
          firstname,
          lastname,
          age,
          village,
          district,
          province,
          docType,
          docNo,
          docImage: docImage_url_list,
          profile: profile_url,
        },
      });
      await client.del(cacheKey + "-" + userId);
      await CacheAndInsertData(cacheKey, model, where, kyc, select);
      SendCreate(res, `${EMessage.insertSuccess} kyc`, kyc);
    } catch (error) {
      // Handle any errors that occurred during the upload or database operations
      SendErrorCatch(res, `${EMessage.insertFailed} kyc`, error);
    }
  },
  async Update(req, res) {
    try {
      const id = req.params.id;
      let data = DataExist(req.body);

      // Initialize an array to hold the promises
      const kycExistsPromise = [];

      // Add the KYC promise
      const kycPromise = FindKYCById(id);
      kycExistsPromise.push(kycPromise);

      // Add the User promise if userId exists
      if (data.userId) {
        const userPromise = FindUserById(data.userId);
        kycExistsPromise.push(userPromise);
      }

      // Await all promises
      const results = await Promise.all(kycExistsPromise);

      // Extract the results based on what was promised
      const kycExists = results.shift();
      const userExists = data.userId ? results.shift() : true;

      // Handle case where KYC does not exist
      if (!kycExists) {
        return SendError(res, 404, `${EMessage.notFound} KYC with id: ${id}`);
      }

      // Handle case where user does not exist
      if (data.userId && !userExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} user with id: ${data.userId}`
        );
      }

      // Parse the age if it's provided and is not a number
      if (data.age && typeof data.age !== "number") {
        data.age = parseInt(data.age, 10);
        if (isNaN(data.age)) {
          return SendError(
            res,
            400,
            `${EMessage.invalidInput}: age must be a number`
          );
        }
      }

      // Update the KYC record
      const kyc = await prisma.kyc.update({
        where: { id },
        data,
      });

      // Clear the cache
      await client.del(cacheKey, cacheKey + "-" + kycExists.userId);

      await  CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      // Send success response
      SendSuccess(res, `${EMessage.updateSuccess}`, kyc);
    } catch (error) {
      // Catch any errors that occur during the update
      SendErrorCatch(res, `${EMessage.updateFailed} KYC`, error);
    }
  },
  async Delete(req, res) {
    try {
      const id = req.params.id;
      const kycExists = await FindKYCById(id);
      if (!kycExists) {
        return SendError(
          res,
          404,
          `${EMessage.notFound} kyc with id: ${data.userId}`
        );
      }
      const kyc = await prisma.kyc.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      await client.del([cacheKey, cacheKey + "-" + kycExists.userId]);
      await  CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.deleteSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.deleteFailed} kyc`, error);
    }
  },

  async UpdateProfile(req, res) {
    try {
      const id = req.params.id;
      const data = req.files;
      const { oldProfile } = req.body;
      if (!oldProfile) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldProfile`);
      }
      const kycExists = await FindKYCById(id);
      if (!kycExists) {
        return SendError(res, 404, `${EMessage.notFound} KYC with id: ${id}`);
      }
      if (!data || !data.profile) {
        return SendError(res, 400, `${EMessage.pleaseInput}: profile `);
      }

      const profile = await  S3UploadImage(data.profile,oldProfile).then(
        (url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        }
      );
      const kyc = await prisma.kyc.update({
        where: {
          id,
        },
        data: {
          profile,
        },
      });
      await client.del([cacheKey, cacheKey + "-" + kycExists.userId]);
      await  CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
      SendSuccess(res, `${EMessage.updateSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} profile kyc`, error);
    }
  },
  async UpdateDocImage(req, res) {
    try {
      const id = req.params.id;
      const data = req.files;
      let { oldDocImage } = req.body;
      if (!oldDocImage) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldDocImage`);
      }
      oldDocImage = oldDocImage.split(",");
      if (oldDocImage.length === 0) {
        return SendError(res, 400, `${EMessage.pleaseInput}: oldDocImage`);
      }

      if (!data || !data.docImage) {
        return SendError(res, 400, `${EMessage.pleaseInput}: docImage`);
      }

      const dataDocImageToList = !data.docImage.length
        ? [data.docImage]
        : data.docImage;
      if (dataDocImageToList.length !== oldDocImage.length) {
        return SendError(
          res,
          400,
          `${EMessage.pleaseInput}: The number of provided docImage files does not match the existing records. Please ensure you have uploaded the correct number of images.`
        );
      }

      const kycExists = await FindKYCById(id);
      if (!kycExists) {
        return SendError(res, 404, `${EMessage.notFound} KYC with id: ${id}`);
      }
      // Check which old images to keep
      const OldDocImageList = kycExists.docImage;
      let docImageList = CheckUniqueElement(OldDocImageList, oldDocImage);

      // Prepare promises for uploading new images
      const DocImagePromise = dataDocImageToList.map((image, index) =>
        S3UploadImage(image, oldDocImage[index]).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );

      // Await all upload promises
      const newDocImage_List_Url = await Promise.all(DocImagePromise);

      // Combine old and new image URLs
      docImageList = docImageList.concat(newDocImage_List_Url);

      // Update the KYC document with the new image URLs
      const kyc = await prisma.kyc.update({
        where: { id },
        data: { docImage: docImageList },
      });
      await client.del([cacheKey, cacheKey + "-" + kycExists.userId]);
      CacheAndRetrieveUpdatedData(cacheKey, model, where);
      SendSuccess(res, `${EMessage.updateSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} docImage kyc`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      let kyc = await CacheAndRetrieveUpdatedData(cacheKey, model, where);
      return SendSuccess(res, `${EMessage.fetchAllSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} docImage kyc`, error);
    }
  },
  async SelectOne(req, res) {
    try {
      // await client.del(cacheKey);
      const id = req.params.id;
      const kyc = await FindKYCById(id);
      if (!kyc) {
        return SendError(res, 404, `${EMessage.notFound} KYC with id: ${id}`);
      }
      return SendSuccess(res, `${EMessage.selectAllSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} docImage kyc`, error);
    }
  },
  async SelectByUserId(req, res) {
    try {
      const id = req.params.id;
      
      where = {
        isActive: true,
        userId: id,
      };
      let kyc = await CacheAndRetrieveUpdatedData(cacheKey + "-" + id, model, where);
      return SendSuccess(res, `${EMessage.fetchAllSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingOne} docImage kyc`, error);
    }
  },
};
export default KYCController;
