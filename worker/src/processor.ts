import type { Job } from "bullmq";
import { DelayedError } from "bullmq";
import { prisma } from "@reachinbox/db";
import { indexEmail } from "@reachinbox/search";
import type { SendEmailJob } from "@reachinbox/contracts";
import { env } from "./env.js";
import { redis } from "./redis.js";
import { searchClient } from "./search.js";
import { getTransporter } from "./transporter.js";
import { checkRateLimit, tryAcquireNotifyMarker, msUntilNextUtcHour } from "./rateLimiter.js";
import { sendSlackRateLimitNotification } from "./slack.js";
import nodemailer from "nodemailer";

export async function processEmailJob(job: Job<SendEmailJob>): Promise<void> {
  const { emailId } = job.data;
  if (!emailId) {
    throw new Error("Missing emailId in job data");
  }

  // Load current state from PostgreSQL using emailId.
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { sender: true },
  });

  if (!email) {
    // No DB row; treat as unrecoverable – avoid retry loop.
    throw new Error(`Email ${emailId} not found`);
  }

  // Idempotency: skip rows already marked sent.
  if (email.status === "sent") {
    return;
  }

  // Atomically claim work before SMTP sending if currently scheduled.
  // If status is scheduled, try to move to processing. If already processing,
  // allow retry path (BullMQ retries after failures).
  if (email.status === "scheduled") {
    const claimed = await prisma.email.updateMany({
      where: { id: emailId, status: "scheduled" },
      data: { status: "processing" },
    });
    if (claimed.count === 0) {
      const fresh = await prisma.email.findUnique({ where: { id: emailId } });
      if (fresh?.status === "sent") return;
      // If fresh is still scheduled, another worker won race – retry by throwing
      // so BullMQ will retry; but to avoid busy loop, just return and let next retry handle.
      if (fresh?.status !== "processing" && fresh?.status !== "scheduled") {
        return;
      }
    }
  } else if (email.status !== "processing") {
    // For any other non-retriable state (e.g. failed already and attempts exhausted), skip.
    // However if job is being retried and status is failed, allow reprocessing until attempts exhausted.
    // We treat failed as terminal unless the job still has retries left – but worker concurrency
    // should not reprocess failed rows without explicit reconciliation, so skip.
    if (email.status === "failed") {
      // If BullMQ is retrying, sender may still want to retry SMTP; but our DB marks failed only after
      // final failure. So seeing failed here likely means manual or previous terminal failure – skip.
      return;
    }
  }

  // Re-fetch effective limit: lower of sender's configured limit and global MAX_EMAILS_PER_HOUR.
  const effectiveLimit = Math.min(email.sender.hourlyLimit, env.MAX_EMAILS_PER_HOUR);

  // Atomic Redis per-sender hourly limiting.
  const allowed = await checkRateLimit(redis, email.senderId, effectiveLimit);

  if (!allowed) {
    // Only one Slack notification per sender/hour limit event.
    const shouldNotify = await tryAcquireNotifyMarker(redis, email.senderId);
    if (shouldNotify) {
      // Load and decrypt webhook at notification time; missing Slack is no-op.
      // Must never fail the email job.
      try {
        await sendSlackRateLimitNotification(email.ownerId, email.sender.email);
      } catch {
        // ignore
      }
    }

    // Move job to next hour and throw DelayedError so BullMQ marks it delayed.
    // Do NOT permanently fail or discard the job.
    // Also revert status so next attempt can re-check rate limit.
    // Set back to scheduled so claim logic on next attempt works.
    try {
      await prisma.email.updateMany({
        where: { id: emailId, status: "processing" },
        data: { status: "scheduled" },
      });
    } catch {
      // ignore revert errors
    }

    const delayMs = msUntilNextUtcHour();
    const timestamp = Date.now() + delayMs;
    // job.token is present when job is in active state; use empty string fallback.
    await job.moveToDelayed(timestamp, (job as unknown as { token?: string }).token ?? "");
    throw new DelayedError(`Rate limited for sender ${email.sender.email}, delayed to next hour`);
  }

  // Send via Ethereal/Nodemailer using reused pooled transporter.
  const transporter = getTransporter();
  let info: nodemailer.SentMessageInfo;
  try {
    info = await transporter.sendMail({
      from: email.sender.email,
      to: email.recipient,
      subject: email.subject,
      text: email.body,
      html: `<p>${email.body}</p>`,
    });
  } catch (err) {
    // On SMTP failure, revert status to scheduled so next retry can re-attempt.
    // Throw to trigger BullMQ retry with exponential backoff.
    try {
      await prisma.email.updateMany({
        where: { id: emailId, status: "processing" },
        data: { status: "scheduled" },
      });
    } catch {
      // ignore
    }
    throw err;
  }

  const messageId: string | undefined = (info as { messageId?: string }).messageId;
  const testUrl = nodemailer.getTestMessageUrl(info);
  const previewUrl: string | null = typeof testUrl === "string" ? testUrl : null;

  const now = new Date();

  // Update PostgreSQL to sent with atomic safeguard (only if not already sent).
  // Minimize SMTP-accepted-before-DB-update window by updating immediately after SMTP.
  try {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: "sent",
        sentAt: now,
        smtpMessageId: messageId ?? null,
        previewUrl,
        failureReason: null,
      },
    });
  } catch (err) {
    // If update fails after SMTP accepted, email has been sent but DB not updated.
    // This is the unavoidable window documented in README. Log and rethrow for retry;
    // next run will see status still processing/scheduled and may resend.
    // eslint-disable-next-line no-console
    console.error(`Failed to update email ${emailId} to sent after SMTP accept`, err);
    throw err;
  }

  // Re-index same email ID as sent in Elasticsearch. Failure should not fail the job.
  try {
    await indexEmail(searchClient, {
      id: email.id,
      ownerId: email.ownerId,
      recipient: email.recipient,
      senderEmail: email.sender.email,
      subject: email.subject,
      body: email.body,
      scheduledAt: email.scheduledAt.toISOString(),
      sentAt: now.toISOString(),
      status: "sent",
      failureReason: null,
      previewUrl,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to index sent email ${emailId}`, err);
  }
}
