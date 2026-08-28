import { Redis } from "ioredis";
import { env } from "./env.js";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Separate client for rate-limit Lua operations that should not interfere with BullMQ's blocking commands.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
