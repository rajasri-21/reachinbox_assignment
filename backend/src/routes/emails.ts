import { randomUUID } from "node:crypto";
import { Router } from "express";
import { db } from "@reachinbox/db";
import { ensureEmailIndex, indexEmail, searchEmails } from "@reachinbox/search";
import type { ScheduleEmailResponse, EmailListResponse, SendEmailJob } from "@reachinbox/contracts";
import { emailQueue } from "../queue.js";
import { searchClient } from "../search.js";
import { requireAuth } from "../middleware/auth.js";
import { parseScheduleRequest, parseEmailListQuery } from "../lib/validation.js";
import { mapEmailRow, mapSearchDoc } from "../lib/mapEmail.js";

export const emailsRouter = Router();

const SEND_EMAIL_JOB = "send-email";
const MAX_ATTEMPTS = 5;
const BACKOFF_DELAY_MS = 2000;

emailsRouter.post("/schedule", requireAuth, async (req, res, next) => {
  try {
    const input = parseScheduleRequest(req.body);
    const ownerId = req.user!.id;
    const startAtMs = Date.parse(input.startAt);

    const sender = await db.sender.upsert({
      where: { ownerId_email: { ownerId, email: input.senderEmail } },
      create: { ownerId, email: input.senderEmail, hourlyLimit: input.hourlyLimit },
      update: { hourlyLimit: input.hourlyLimit },
    });

    const rows = input.recipients.map((recipient, index) => ({
      id: randomUUID(),
      ownerId,
      senderId: sender.id,
      recipient,
      subject: input.subject,
      body: input.body,
      scheduledAt: new Date(startAtMs + index * input.delayMs),
    }));

    await db.email.createMany({ data: rows });

    const now = Date.now();
    await emailQueue.addBulk(
      rows.map((row) => ({
        name: SEND_EMAIL_JOB,
        data: { emailId: row.id } satisfies SendEmailJob,
        opts: {
          jobId: `email-${row.id}`,
          delay: Math.max(0, row.scheduledAt.getTime() - now),
          attempts: MAX_ATTEMPTS,
          backoff: { type: "exponential", delay: BACKOFF_DELAY_MS },
          removeOnComplete: false,
          removeOnFail: false,
        },
      })),
    );

    try {
      await ensureEmailIndex(searchClient);
      await Promise.all(
        rows.map((row) =>
          indexEmail(searchClient, {
            id: row.id,
            ownerId,
            recipient: row.recipient,
            senderEmail: sender.email,
            subject: row.subject,
            body: row.body,
            scheduledAt: row.scheduledAt.toISOString(),
            sentAt: null,
            status: "scheduled",
            failureReason: null,
            previewUrl: null,
          }),
        ),
      );
    } catch (searchErr) {
      // Elasticsearch is a search projection, never the source of truth. A
      // temporary indexing failure must not block scheduling.
      // eslint-disable-next-line no-console
      console.error("Failed to index scheduled emails", searchErr);
    }

    const response: ScheduleEmailResponse = { scheduledCount: rows.length };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

emailsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const { status, q, page, limit } = parseEmailListQuery(
      req.query as Record<string, unknown>,
    );

    if (q) {
      const result = await searchEmails(searchClient, ownerId, { q, status, page, limit });
      const response: EmailListResponse = {
        emails: result.items.map(mapSearchDoc),
        page: result.page,
        limit: result.limit,
        total: result.total,
      };
      res.json(response);
      return;
    }

    const where = { ownerId, ...(status ? { status } : {}) };
    const [rows, total] = await Promise.all([
      db.email.findMany({
        where,
        include: { sender: true },
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.email.count({ where }),
    ]);

    const response: EmailListResponse = {
      emails: rows.map(mapEmailRow),
      page,
      limit,
      total,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});
