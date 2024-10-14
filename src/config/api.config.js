import dotenv from "dotenv";
dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

const KLimit = 20;
const EAPI = process.env.EAPI;
const SERVER_PORT = process.env.SERVER_PORT;

const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const JWT_TIMEOUT = process.env.JWT_TIMEOUT;
const JWT_REFRECH_TIMEOUT = process.env.JWT_REFRECH_TIMEOUT;

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const AWS_BUCKET_KEY = process.env.AWS_BUCKET_KEY;
const AWS_BASE_URL = process.env.AWS_BASE_URL;

const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export {
  KLimit,
  EAPI,
  SERVER_PORT,
  SECRET_KEY,
  REFRESH_TOKEN,
  JWT_TIMEOUT,
  JWT_REFRECH_TIMEOUT,
  AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET_KEY,
  AWS_BASE_URL,
  CLOUDINARY_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  REDIS_HOST,
  REDIS_PORT,
};
