import { EMAIL_STATUSES, type EmailStatus, type ScheduleEmailRequest } from "@reachinbox/contracts";
import { badRequest } from "./httpError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 5000;
const MAX_DELAY_MS = 24 * 60 * 60 * 1000; // 24h between sends is already extreme
const MAX_HOURLY_LIMIT = 100_000;

function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

export function parseScheduleRequest(body: unknown): ScheduleEmailRequest & { recipients: string[] } {
  if (typeof body !== "object" || body === null) {
    throw badRequest("Request body must be a JSON object");
  }
  const b = body as Record<string, unknown>;

  if (!isEmail(b.senderEmail)) {
    throw badRequest("senderEmail must be a valid email address");
  }
  if (typeof b.subject !== "string" || b.subject.trim().length === 0) {
    throw badRequest("subject is required");
  }
  if (typeof b.body !== "string" || b.body.length === 0) {
    throw badRequest("body is required");
  }
  if (!Array.isArray(b.recipients) || b.recipients.length === 0) {
    throw badRequest("recipients must be a non-empty array");
  }
  if (b.recipients.length > MAX_RECIPIENTS) {
    throw badRequest(`recipients cannot exceed ${MAX_RECIPIENTS} entries`);
  }

  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const r of b.recipients) {
    if (!isEmail(r)) {
      throw badRequest(`invalid recipient email: ${String(r)}`);
    }
    const normalized = r.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      recipients.push(r);
    }
  }

  if (typeof b.startAt !== "string" || Number.isNaN(Date.parse(b.startAt))) {
    throw badRequest("startAt must be a valid ISO 8601 date string");
  }
  const startAtMs = Date.parse(b.startAt);
  if (startAtMs <= Date.now()) {
    throw badRequest("startAt must be in the future");
  }

  if (typeof b.delayMs !== "number" || !Number.isInteger(b.delayMs) || b.delayMs < 0) {
    throw badRequest("delayMs must be a non-negative integer");
  }
  if (b.delayMs > MAX_DELAY_MS) {
    throw badRequest(`delayMs cannot exceed ${MAX_DELAY_MS}`);
  }

  if (
    typeof b.hourlyLimit !== "number" ||
    !Number.isInteger(b.hourlyLimit) ||
    b.hourlyLimit < 1
  ) {
    throw badRequest("hourlyLimit must be a positive integer");
  }
  if (b.hourlyLimit > MAX_HOURLY_LIMIT) {
    throw badRequest(`hourlyLimit cannot exceed ${MAX_HOURLY_LIMIT}`);
  }

  return {
    senderEmail: b.senderEmail,
    subject: b.subject.trim(),
    body: b.body,
    recipients,
    startAt: b.startAt,
    delayMs: b.delayMs,
    hourlyLimit: b.hourlyLimit,
  };
}

export type EmailListQuery = {
  status?: EmailStatus;
  q?: string;
  page: number;
  limit: number;
};

export function parseEmailListQuery(query: Record<string, unknown>): EmailListQuery {
  let status: EmailStatus | undefined;
  if (typeof query.status === "string" && query.status.length > 0) {
    if (!(EMAIL_STATUSES as readonly string[]).includes(query.status)) {
      throw badRequest(`status must be one of: ${EMAIL_STATUSES.join(", ")}`);
    }
    status = query.status as EmailStatus;
  }

  const q = typeof query.q === "string" && query.q.trim().length > 0 ? query.q.trim() : undefined;

  let page = 1;
  if (typeof query.page === "string" && query.page.length > 0) {
    const parsed = Number(query.page);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw badRequest("page must be a positive integer");
    }
    page = parsed;
  }

  let limit = 20;
  if (typeof query.limit === "string" && query.limit.length > 0) {
    const parsed = Number(query.limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw badRequest("limit must be an integer between 1 and 100");
    }
    limit = parsed;
  }

  return { status, q, page, limit };
}
