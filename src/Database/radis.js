import redis from "redis";
import { REDIS_HOST, REDIS_PORT } from "../config/api.config.js"; // Adjust path as needed

const client = redis.createClient({
  url: `redis://${REDIS_HOST || "redis"}:${REDIS_PORT || 6379}`,
  
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

export default client;
