import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '../config/api.config.js'; // Adjust path as needed

const redis = new Redis({
  host: REDIS_HOST || 'redis', // Use the service name from docker-compose
  port: REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 15000); // Retry with an exponential backoff
    return delay;
  },
});

export default redis;
