import client from "../Database/radis.js";
import prisma from "../util/prismaClient.js";
import { CacheAndRetrieveUpdatedData } from "./service.js";

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

const findIdInCached = async (cacheKey, model, where, select) => {
  // Retrieve cached data from client
  let cachedData = await client.get(cacheKey);

  if (!cachedData) {
    // If cache is empty, fetch data from the database
    const result = await prisma[model].findFirst({
      where,
      select,
    });

    delete where.id;
    console.log("object :>> ", where);
    CacheAndRetrieveUpdatedData(cacheKey, model, where, select);
    return result;
  }

  // Parse cached data
  const data = JSON.parse(cachedData);
  console.log("object :>>|| ", where.id);
  // Find the specific item by ID
  const result = data.find((item) => item.id === where.id);

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
  return findIdInCached(
    "users",
    "user",
    { id, isActive: true },
    {
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
    }
  );
};

export const FindUserByPhoneNumber = (phoneNumber) => {
  return findFirst("user", { phoneNumber, isActive: true });
};

export const FindBannerById = (id) => {
  return findIdInCached("banners", "banner", { id, isActive: true });
};

export const FindPromotionId = (id) => {
  return findIdInCached("promotions", "promotion", { id, isActive: true });
};

export const FindStatusById = (id) => {
  return findIdInCached("status", "status", { id, isActive: true });
};

export const FindCategoryById = (id) => {
  return findIdInCached("categorys", "category", { id, isActive: true });
};

export const FindKYCById = (id) => {
  return findIdInCached("kycs", "kyc", { id, isActive: true });
};

export const FindOrderById = (id) => {
  return findIdInCached(
    "orders",
    "order",
    { id, isActive: true },
    {
      id: true,
      userId: true,
      serviceId: true,
      paymentId: true,
      promotionId: true,
      bookingPrice: true,
      totalPrice: true,
      billQR: true,
      createAt: true,
      updateAt: true,
      status: true,
      service: {
        select: {
          id: true,
          // posterId: true,
          // categoryId: true,
          // statusId: true,
          // user:{}
          name: true,
          village: true,
          district: true,
          province: true,
          priceMonth: true,
          priceYear: true,
          priceCommission: true,
          detail: true,
          isShare: true,
          images: true,
          coverImage: true,
          createAt: true,
          updateAt: true,
          user: {
            select: {
              username: true,
              phoneNumber: true,
            },
          },
          category: {
            select: { title: true, icon: true },
          },
          status: {
            select: {
              name: true,
            },
          },
        },
      },
      promotion: {
        select: {
          code: true,
          qty: true,
          startTime: true,
          endTime: true,
        },
      },
    }
  );
};

export const FindPaymentById = (id) => {
  return findIdInCached("payments", "payment", { id, isActive: true });
};

export const FindReviewById = (id) => {
  return findIdInCached(
    "reviews",
    "review",
    { id, isActive: true },
    {
      id: true,
      userId: true,
      orderId: true,
      reason: true,
      star: true,
      createAt: true,
      updateAt: true,
      user: {
        select: {
          username: true,
          phoneNumber: true,
        },
      },
    }
  );
};

export const FindServiceById = (id) => {
  return findIdInCached(
    "services",
    "service",
    { id, isActive: true },
    {
      id: true,
      posterId: true,
      // categoryId: true,
      // statusId: true,
      // user:{}
      name: true,
      village: true,
      district: true,
      province: true,
      priceMonth: true,
      priceYear: true,
      priceCommission: true,
      detail: true,
      isShare: true,
      images: true,
      coverImage: true,
      createAt: true,
      updateAt: true,
      user: {
        select: {
          username: true,
          phoneNumber: true,
        },
      },
      category: {
        select: { title: true, icon: true },
      },
      status: {
        select: {
          name: true,
        },
      },
    }
  );
};

export const FindWalletById = (id) => {
  return findIdInCached(
    "wallets",
    "wallet",
    { id, isActive: true },
    {
      id: true,
      userId: true,
      promotionId: true,
      createAt: true,
      updateAt: true,
      status: true,
      promotion: {
        select: {
          qty: true,
          code: true,
          isGiven: true,
        },
      },
    }
  );
};

export const FindNotificationById = (id) => {
  return findIdInCached("notifications", "notification", {
    id,
    isActive: true,
  });
};
