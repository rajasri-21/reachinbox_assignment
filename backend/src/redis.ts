import { Redis } from "ioredis";
import { env } from "./env.js";

/**
 * Shared BullMQ-compatible Redis connection. `maxRetriesPerRequest: null` is
 * required by BullMQ so blocking commands are not aborted by ioredis itself.
 */
export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
