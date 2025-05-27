import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

// Create Redis client
const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

export const getRedisClient = () => redisClient;

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.disconnect();
    console.log('Redis disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from Redis:', error);
  }
};

// Cache middleware
export const cacheMiddleware = (key: string, expiration: number = 3600) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Create a unique cache key based on URL and params
      const cacheKey = `${key}:${req.originalUrl}`;
      
      // Try to get data from cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        // If data exists in cache, return it
        return res.json(JSON.parse(cachedData));
      }
      
      // If not in cache, modify res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache the response data
        redisClient.setEx(cacheKey, expiration, JSON.stringify(data));
        
        // Call the original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};