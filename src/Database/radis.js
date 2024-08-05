import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "../config/api.config.js";
const redis = new Redis({
  host:REDIS_HOST || 'redis',
  port: REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000); // Retry with an exponential backoff
    return delay;
  },
});
export default redis;
