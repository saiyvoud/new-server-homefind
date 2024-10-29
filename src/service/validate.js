export const validateData = (data) => {
  return Object.keys(data).filter((key) => !data[key]);
};
export const DataExist = (data) => {
  const existDatas = {};
  Object.keys(data).forEach((el) => {
    if (
      data[el] &&
      !el.toLowerCase().includes("image") &&
      !el.toLowerCase().includes("logo")
    ) {
      existDatas[el] = data[el];
    }
  });

  return existDatas;
};
export const ValidateUser = (data) => {
  const { username, password, phoneNumber } = data;
  return validateData({ username, password, phoneNumber });
};

export const ValidateLogin = (data) => {
  const { username, password } = data;
  return validateData({ username, password });
};

export const ValidataLoginPhoneNumber = (data) => {
  const { phoneNumber, password } = data;
  return validateData({ phoneNumber, password });
};

export const ValidateLoginEmail = (data) => {
  const { email, password } = data;
  return validateData({ email, password });
};

export const ValidateLoginPhoneNumber = (data) => {
  const { phoneNumber, password } = data;
  return validateData({ phoneNumber, password });
};

export const ValidateChangePassword = (data) => {
  const { newPassword, oldPassword } = data;
  return validateData({ newPassword, oldPassword });
};

export const VaildateForgotPassword = (data) => {
  const { phoneNumber, newPassword } = data;
  return validateData({ phoneNumber, newPassword });
};
//-------------------------------------------------------------------------------
export const ValidateStatus = (data) => {
  const { name } = data;
  return validateData({ name });
};

export const ValidateBanner = (data) => {
  const { link_url, name } = data;
  return validateData({ link_url, name });
};

export const ValidatePromotion = (data) => {
  const { qty, name, startTime, endTime } = data;
  return validateData({ qty, name, startTime, endTime });
};

export const ValidateCategory = (data) => {
  const { title, showHome } = data;
  return validateData({ title, showHome });
};

export const ValidateKYC = (data) => {
  const {
    userId,
    firstname,
    lastname,
    age,
    village,
    district,
    province,
    docType,
    docNo,
  } = data;
  return validateData({
    userId,
    firstname,
    lastname,
    age,
    village,
    district,
    province,
    docType,
    docNo,
  });
};

export const ValidateWallet = (data) => {
  const { userId, promotionId } = data;
  return validateData({ userId, promotionId });
};

export const ValidatePayment = (data) => {
  const { bankName, accountName, accountNo } = data;
  return validateData({ bankName, accountName, accountNo });
};

export const ValidateService = (data) => {
  const {
    posterId,
    categoryId,
    name,
    village,
    district,
    province,
    priceMonth,
    priceYear,
    priceCommission,
    detail,
    isShare,
    isAllowBooking,
    currency,
    statusId,
  } = data;
  return validateData({
    posterId,
    categoryId,
    name,
    village,
    district,
    province,
    priceMonth,
    priceYear,
    priceCommission,
    detail,
    isShare,
    statusId,
    isAllowBooking,
    currency,
  });
};

export const ValidateOrder = (data) => {
  const {
    userId,
    firstname,
    lastname,
    phoneNumber,
    village,
    district,
    province,
    serviceId,
    paymentId,
    bookingPrice,
    totalPrice,
  } = data;
  return validateData({
    userId,
    firstname,
    lastname,
    phoneNumber,
    village,
    district,
    province,
    serviceId,
    paymentId,
    bookingPrice,
    totalPrice,
  });
};

export const ValidateReview = (data) => {
  const { userId, orderId, reason, star } = data;
  return validateData({ userId, orderId, reason, star });
};
