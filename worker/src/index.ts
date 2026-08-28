import { Worker } from "bullmq";
import { EMAIL_QUEUE, type SendEmailJob } from "@reachinbox/contracts";
import { prisma } from "@reachinbox/db";
import { indexEmail } from "@reachinbox/search";
import { env } from "./env.js";
import { redisConnection, redis } from "./redis.js";
import { searchClient } from "./search.js";
import { verifyTransporter, closeTransporter } from "./transporter.js";
import { processEmailJob } from "./processor.js";
import { reconcileScheduledEmails } from "./reconciler.js";

// Validate required env early
void env.DATABASE_URL;
void env.REDIS_URL;
void env.ELASTICSEARCH_URL;

const worker = new Worker<SendEmailJob>(EMAIL_QUEUE, processEmailJob, {
  connection: redisConnection,
  concurrency: env.WORKER_CONCURRENCY,
  // Global minimum spacing: max 1 job per MIN_SEND_DELAY_MS
  limiter: {
    max: 1,
    duration: env.MIN_SEND_DELAY_MS,
  },
});

worker.on("completed", (job) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
  if (!job) return;
  // DelayedError is not a real failure – job was intentionally delayed for rate limiting
  if (err.name === "DelayedError") {
    // eslint-disable-nextLine no-console
    console.log(`Job ${job.id} delayed: ${err.message}`);
    return;
  }
  // eslint-disable-next-line no-console
  console.error(`Job ${job.id} failed: ${err.message}`);

  // If retries are exhausted, mark email as failed in PostgreSQL and Elasticsearch.
  const maxAttempts = (job.opts.attempts as number | undefined) ?? 5;
  if (job.attemptsMade >= maxAttempts) {
    const emailId = (job.data as SendEmailJob).emailId;
    if (!emailId) return;
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { sender: true },
      });
      if (!email) return;
      if (email.status === "failed" || email.status === "sent") return;

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: "failed",
          failureReason: err.message.slice(0, 1000),
        },
      });

      try {
        await indexEmail(searchClient, {
          id: email.id,
          ownerId: email.ownerId,
          recipient: email.recipient,
          senderEmail: email.sender.email,
          subject: email.subject,
          body: email.body,
          scheduledAt: email.scheduledAt.toISOString(),
          sentAt: null,
          status: "failed",
          failureReason: err.message.slice(0, 1000),
          previewUrl: email.previewUrl,
        });
      } catch (indexErr) {
        // eslint-disable-next-line no-console
        console.error(`Failed to index failed email ${emailId}`, indexErr);
      }
    } catch (dbErr) {
      // eslint-disable-next-line no-console
      console.error(`Failed to mark email ${emailId} as failed`, dbErr);
    }
  }
});

worker.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Worker error", err);
});

async function bootstrap() {
  try {
    // Reuse one verified pooled Ethereal transporter
    await verifyTransporter();
    // eslint-disable-next-line no-console
    console.log("Ethereal transporter verified");

    // Restart reconciliation: re-add unsent scheduled rows with deterministic IDs
    await reconcileScheduledEmails();

    // eslint-disable-next-line no-console
    console.log(
      `Worker started: queue=${EMAIL_QUEUE} concurrency=${env.WORKER_CONCURRENCY} minDelay=${env.MIN_SEND_DELAY_MS}ms maxPerHour=${env.MAX_EMAILS_PER_HOUR}`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Worker bootstrap failed", err);
    process.exit(1);
  }
}

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, closing worker...`);
  try {
    await worker.close();
    await closeTransporter();
    await redis.quit();
    await redisConnection.quit();
    await prisma.$disconnect();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error during shutdown", err);
  } finally {
    process.exit(0);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Handle unavoidable SMTP accepted-before-DB-update window documentation:
// If the process dies after SMTP accepts but before DB update, the email may be sent
// but DB still shows scheduled/processing. On restart, reconciliation will re-queue it
// and it may be sent again. This window is minimized by updating DB immediately after SMTP.

await bootstrap();
