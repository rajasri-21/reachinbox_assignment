import { prisma } from "@reachinbox/db";
import { emailQueue } from "./queue.js";
import type { SendEmailJob } from "@reachinbox/contracts";

const BATCH_SIZE = 500;
const MAX_ATTEMPTS = 5;
const BACKOFF_DELAY_MS = 2000;

/**
 * At startup, find unsent scheduled rows and re-add their deterministic jobs.
 * Re-adding an existing deterministic BullMQ job must be harmless.
 */
export async function reconcileScheduledEmails(): Promise<number> {
  let reconciled = 0;
  let lastId: string | undefined = undefined;

  while (true) {
    const emails: { id: string; scheduledAt: Date }[] = lastId
      ? await prisma.email.findMany({
          where: { status: "scheduled" },
          select: { id: true, scheduledAt: true },
          orderBy: { scheduledAt: "asc" },
          take: BATCH_SIZE,
          cursor: { id: lastId },
          skip: 1,
        })
      : await prisma.email.findMany({
          where: { status: "scheduled" },
          select: { id: true, scheduledAt: true },
          orderBy: { scheduledAt: "asc" },
          take: BATCH_SIZE,
        });

    if (emails.length === 0) break;

    const now = Date.now();
    const jobs = emails.map((row: { id: string; scheduledAt: Date }) => ({
      name: "send-email" as const,
      data: { emailId: row.id } satisfies SendEmailJob,
      opts: {
        jobId: `email-${row.id}`,
        delay: Math.max(0, row.scheduledAt.getTime() - now),
        attempts: MAX_ATTEMPTS,
        backoff: { type: "exponential" as const, delay: BACKOFF_DELAY_MS },
        removeOnComplete: false,
        removeOnFail: false,
      },
    }));

    // addBulk will be harmless if jobId already exists – BullMQ throws but we catch per batch.
    try {
      await emailQueue.addBulk(jobs);
      reconciled += jobs.length;
    } catch (err) {
      // Fallback: try individually ignoring duplicate jobId errors.
      for (const job of jobs) {
        try {
          await emailQueue.add(job.name, job.data, job.opts);
          reconciled += 1;
        } catch (singleErr) {
          const msg = (singleErr as Error)?.message ?? "";
          if (msg.includes("already exists") || msg.includes("JobId") || msg.includes("jobId")) {
            // Already exists – harmless
            continue;
          }
          // eslint-disable-next-line no-console
          console.error(`Failed to reconcile job ${job.opts.jobId}`, singleErr);
        }
      }
      // eslint-disable-next-line no-console
      console.error("Bulk reconcile failed, retried individually", err);
    }

    if (emails.length < BATCH_SIZE) break;
    lastId = emails[emails.length - 1].id;
  }

  if (reconciled > 0) {
    // eslint-disable-next-line no-console
    console.log(`Reconciled ${reconciled} scheduled email jobs`);
  } else {
    // eslint-disable-next-line no-console
    console.log("Reconciliation complete: no scheduled emails to re-queue");
  }

  return reconciled;
}
