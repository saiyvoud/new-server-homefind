import prisma from "../util/Prisma.js";

// Generic function to find a single record
const findOne = (model, where) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await prisma[model].findUnique({ where });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

// Generic function to find the first matching record
const findFirst = (model, where) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await prisma[model].findFirst({ where });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

export const ExistingUser = ({ username, phoneNumber, email }) => {
  return findFirst("user", {
    isActive: true,
    OR: [{ username }, { phoneNumber }, { email }],
  });
};

export const FindUserById = (id) => {
  return findOne("user", { id, isActive: true });
};

export const FindUserByPhoneNumber = (phoneNumber) => {
  return findFirst("user", { phoneNumber, isActive: true });
};

export const FindBannerById = (id) => {
  return findOne("banner", { id, isActive: true });
};

export const FindPromotion = (id) => {
  return findOne("promotion", { id, isActive: true });
};

export const FindStatusById = (id) => {
  return findOne("status", { id, isActive: true });
};

export const FindCategoryById = (id) => {
  return findOne("category", { id, isActive: true });
};

export const FindKYCById = (id) => {
  return findOne("kyc", { id, isActive: true });
};

export const FindOrderById = (id) => {
  return findOne("order", { id, isActive: true });
};

export const FindPaymentById = (id) => {
  return findOne("payment", { id, isActive: true });
};

export const FindReviewById = (id) => {
  return findOne("review", { id, isActive: true });
};

export const FindServieById = (id) => {
  return findOne("service", { id, isActive: true });
};

export const FindWalletById = (id) => {
  return findOne("wallet", { id, isActive: true });
};

export const FindNotificationById = (id) => {
  return findOne("notification", { id, isActive: true });
};
