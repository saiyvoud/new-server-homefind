import redis from "../Database/radis.js";
import prisma from "../util/Prisma.js";

// Generic function to find a single record
const findOne = (model, where, select) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await prisma[model].findUnique({ where, select });
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

 const findIdInCached = async (cacheKey, model, id, select) => {
  // Retrieve cached data from Redis
  let cachedData = await redis.get(cacheKey);

  if (!cachedData) {
    // If cache is empty, fetch data from the database
    const result = await prisma[model].findFirst({
      where: { id, isActive: true },
      select,
    });
    return result;
  }

  // Parse cached data
  const data = JSON.parse(cachedData);

  // Find the specific item by ID
  const result = data.find((item) => item.id === id);

  return result || null; // Return the result or null if not found
};

export const ExistingUser = ({ username, phoneNumber, email }) => {
  return findFirst("user", {
    isActive: true,
    OR: [{ username }, { phoneNumber }, { email }],
  });
};
export const FindUserByIdShowPassword = (id) => {
  return findOne("user", { id, isActive: true });
};

export const FindUserById = (id) => {
  return findIdInCached("users", "user", id, {
    id: true,
    isActive: true,
    username: true,
    email: true,
    phoneNumber: true,
    profile: true,
    kyc: true,
    role: true,
    createAt: true,
    updateAt: true,
  });
};

export const FindUserByPhoneNumber = (phoneNumber) => {
  return findFirst("user", { phoneNumber, isActive: true });
};

export const FindBannerById = (id) => {
  return findIdInCached("banners", "banner", id);
};

export const FindPromotionId = (id) => {
  return findIdInCached("promotions", "promotion", id);
};

export const FindStatusById = (id) => {
  return findIdInCached("status", "status", id);
};

export const FindCategoryById = (id) => {
  return findIdInCached("categorys", "category", id);
};

export const FindKYCById = (id) => {
  return findIdInCached("kycs", "kyc", id);
};

export const FindOrderById = (id) => {
  return findIdInCached("orders", "order", id);
};

export const FindPaymentById = (id) => {
  return findIdInCached("payments", "payment", id);
};

export const FindReviewById = (id) => {
  return findIdInCached("reviews", "review", id);
};

export const FindServiceById = (id) => {
  return findIdInCached("services", "service", id);
};

export const FindWalletById = (id) => {
  return findIdInCached("wallets", "wallet", id);
};

export const FindNotificationById = (id) => {
  return findIdInCached("notifications", "notification", id);
};
