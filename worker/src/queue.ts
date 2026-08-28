import { Queue } from "bullmq";
import { EMAIL_QUEUE } from "@reachinbox/contracts";
import { redisConnection } from "./redis.js";

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: redisConnection,
});
