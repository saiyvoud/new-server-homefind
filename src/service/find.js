import prisma from "../util/Prisma.js";

export const ExistingUser = ({ username, phoneNumber, email }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          isActive: true,
          OR: [{ username }, { phoneNumber }, { email }],
        },
      });

      resolve(user);
    } catch (error) {
      reject(error);
    }
  });
};

export const FindUserById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id, isActive: true },
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

export const FindUserByPhoneNumber = (phoneNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await prisma.user.findFirst({
        where: { phoneNumber, isActive: true },
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

export const FindBannerById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const banner = await prisma.banner.findUnique({
        where: { id, isActive: true },
      });
      resolve(banner);
    } catch (err) {
      reject(err);
    }
  });
};

export const FindPromotion = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const promotion = await prisma.promotion.findUnique({
        where: { id, isActive: true },
      });
      resolve(promotion);
    } catch (error) {
      reject(error);
    }
  });
};
export const FindStatusById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const promotion = await prisma.status.findUnique({
        where: { id, isActive: true },
      });
      resolve(promotion);
    } catch (error) {
      reject(error);
    }
  });
};

export const FindCategoryById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const promotion = await prisma.category.findUnique({
        where: { id, isActive: true },
      });
      resolve(promotion);
    } catch (error) {
      reject(error);
    }
  });
};
