import redis from "redis";
import { REDIS_HOST, REDIS_PORT } from "../config/api.config.js"; // Adjust path as needed

const client = redis.createClient({
  url: `redis://${REDIS_HOST || "redis"}:${REDIS_PORT || 6379}`,
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

export const connectRedis = async () => {
  try {
    await client.connect();
    console.log("Connected to Redis successfully");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
};
connectRedis();

export default client;
