import { Queue } from "bullmq";
import { EMAIL_QUEUE } from "@reachinbox/contracts";
import { redisConnection } from "./redis.js";

/**
 * The single producer-side queue handle for `email-send`. The worker
 * (Person 2) owns the corresponding `Worker`; this file must never define a
 * second queue name or a `QueueScheduler`.
 */
export const emailQueue = new Queue(EMAIL_QUEUE, { connection: redisConnection });
