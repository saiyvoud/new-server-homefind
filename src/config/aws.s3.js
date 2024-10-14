import { S3Client } from "@aws-sdk/client-s3";
import {
  AWS_ACCESS_KEY,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "./api.config.js";

// Initialize S3Client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});


export default s3Client;
