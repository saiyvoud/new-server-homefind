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

export const ValidateStatus = (data) => {
  const { name } = data;
  return validateData({ name });
};

export const ValidateCategory = (data) => {
  const { title } = data;
  return validateData({ title });
};
