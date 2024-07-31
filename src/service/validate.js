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
