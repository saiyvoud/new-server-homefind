import { Redis } from "ioredis";
const redis = new Redis({
  // host: "localhost",
  // port: 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000); // Retry with an exponential backoff
    return delay;
  },
});
export default redis;
