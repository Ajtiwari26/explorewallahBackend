import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.UPSTASH_REDIS_REST_URL || 'https://open-hornet-99407.upstash.io';
const token = process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAYRPAAIgcDI1MTQ0MjBjYTRlY2U0NDE0YWE0OGE4MzY1YjE5ZjQ3Yw';

export const redis = new Redis({
  url,
  token,
});

export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redis.ping();
    console.log('✅ Upstash Redis Connected Successfully! PONG:', pong);
    return true;
  } catch (error) {
    console.warn('⚠️ Upstash Redis Connection Failed, operating with DB fallback:', error);
    return false;
  }
};
