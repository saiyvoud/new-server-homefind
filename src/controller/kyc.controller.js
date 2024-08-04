import redis from "../Database/radis.js";
import { EMessage } from "../service/enum.js";
import { FindKYCById, FindUserById } from "../service/find.js";
import {
  CacheAndInsertData,
  CacheAndRetrieveUpdatedData,
  CheckUniqueElement,
  SendCreate,
  SendError,
  SendErrorCatch,
  SendSuccess,
} from "../service/service.js";
import { UploadImage } from "../service/uploadImage.js";
import { DataExist, ValidateKYC } from "../service/validate.js";
import prisma from "../util/Prisma.js";

let cacheKey = "kycs";
let model = "kyc";
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

      // Create an array of promises for document image uploads
      const docImagePromises = data.docImage.map((image) =>
        UploadImage(image.data).then((url) => {
          if (!url) {
            throw new Error("Upload Image failed");
          }
          return url;
        })
      );

      // Add the profile image upload promise to the array
      const profilePromise = UploadImage(data.profile.data).then((url) => {
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
      await CacheAndInsertData(cacheKey, model, kyc);
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
      await redis.del(cacheKey);

      CacheAndRetrieveUpdatedData(cacheKey, model);
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
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedData(cacheKey, model);
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

      const profile = await UploadImage(data.profile.data, oldProfile).then(
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
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedData(cacheKey, model);
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
        UploadImage(image.data, oldDocImage[index]).then((url) => {
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
      await redis.del(cacheKey);
      CacheAndRetrieveUpdatedData(cacheKey, model);
      SendSuccess(res, `${EMessage.updateSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.updateFailed} docImage kyc`, error);
    }
  },
  async SelectAll(req, res) {
    try {
      let kyc = await CacheAndRetrieveUpdatedData(cacheKey, model);
      return SendSuccess(res, `${EMessage.selectAllSuccess}`, kyc);
    } catch (error) {
      SendErrorCatch(res, `${EMessage.errorFetchingAll} docImage kyc`, error);
    }
  },
  async SelectOne(req, res) {
    try {
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
};
export default KYCController;
