export const SendSuccess = (res, message, data) => {
  res.status(200).json({ status: true, message, data });
};
export const SendErrors = (res, status, message, err) => {
  res.status(status).json({ status: false, message, data: {}, err });
};


export const SendCreate = (res, message, data) => {
    res.status(201).json({ status: true, message, data });
  };
  
  export const SendErrorCatch = (res, message, error) => {
    console.log(`Error:${message}`, error);
    res.status(500).json({ status: false, message, error });
  };
  