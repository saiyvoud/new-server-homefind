const validateData = (data) => {
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
  const { username, email, password, phoneNumber } = data;
  return validateData({ username, email, password, phoneNumber });
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
  const { link_url } = data;
  return validateData({ link_url });
};

export const ValidatePromotion = (data) => {
  const { qty, start_time, end_time } = data;
  return validateData({ qty, start_time, end_time });
};

export const ValidateCategory = (data) => {
  const { title } = data;
  return validateData({ title });
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
  const { userId, promotion_id } = data;
  return validateData({ userId, promotion_id });
};

export const ValidatePayment = (data) => {
  const { bankName, accountName, accountNo } = data;
  return validateData({ bankName, accountName, accountNo });
};

export const ValidateService = (data) => {
  const {
    poster_id,
    category_id,
    name,
    village,
    district,
    province,
    priceMoth,
    priceYear,
    priceCommission,
    detail,
    isShare,
    status_id,
  } = data;
  return validateData({
    poster_id,
    category_id,
    name,
    village,
    district,
    province,
    priceMoth,
    priceYear,
    priceCommission,
    detail,
    isShare,
    status_id,
  });
};
