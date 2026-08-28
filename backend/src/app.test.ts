import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { db } from "@reachinbox/db";
import { createApp } from "./app.js";
import { signSessionCookieValue, SESSION_COOKIE } from "./session.js";
import { emailQueue } from "./queue.js";
import { redisConnection } from "./redis.js";
import { searchClient } from "./search.js";

const app = createApp();
const server = app.listen(0);
const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

const createdUserIds: string[] = [];

async function createTestUser() {
  const user = await db.user.create({
    data: {
      googleSub: `test-sub-${randomUUID()}`,
      email: `${randomUUID()}@example.com`,
      name: "Test User",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

function cookieHeader(userId: string): string {
  return `${SESSION_COOKIE}=${signSessionCookieValue(userId)}`;
}

async function scheduleEmails(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  const body = {
    senderEmail: `sender-${randomUUID()}@example.com`,
    subject: "Hello",
    body: "Email body",
    recipients: [`lead-${randomUUID()}@example.com`, `lead-${randomUUID()}@example.com`],
    startAt: new Date(Date.now() + 60_000).toISOString(),
    delayMs: 1000,
    hourlyLimit: 200,
    ...overrides,
  };
  const res = await fetch(`${baseUrl}/api/emails/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader(userId) },
    body: JSON.stringify(body),
  });
  return { res, body };
}

after(async () => {
  server.close();
  await emailQueue.close();
  await redisConnection.quit();
  await searchClient.close();
  await db.email.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await db.sender.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await db.slackConnection.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await db.$disconnect();
});

describe("health", () => {
  it("GET /health returns ok without auth", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  });
});

describe("authentication boundary", () => {
  const protectedRequests: Array<[string, string]> = [
    ["GET", "/api/auth/me"],
    ["GET", "/api/emails"],
    ["POST", "/api/emails/schedule"],
    ["GET", "/api/integrations/slack"],
    ["DELETE", "/api/integrations/slack"],
    ["GET", "/admin/queues"],
  ];

  for (const [method, path] of protectedRequests) {
    it(`${method} ${path} returns 401 without a session`, async () => {
      const res = await fetch(`${baseUrl}${path}`, { method });
      assert.equal(res.status, 401);
    });
  }

  it("GET /admin/queues succeeds for an authenticated user", async () => {
    const user = await createTestUser();
    const res = await fetch(`${baseUrl}/admin/queues`, {
      headers: { Cookie: cookieHeader(user.id) },
    });
    assert.equal(res.status, 200);
  });
});

describe("POST /api/emails/schedule validation", () => {
  it("rejects an invalid recipient email with 400", async () => {
    const user = await createTestUser();
    const { res } = await scheduleEmails(user.id, { recipients: ["not-an-email"] });
    assert.equal(res.status, 400);
  });

  it("rejects a startAt in the past with 400", async () => {
    const user = await createTestUser();
    const { res } = await scheduleEmails(user.id, {
      startAt: new Date(Date.now() - 60_000).toISOString(),
    });
    assert.equal(res.status, 400);
  });

  it("rejects a negative delayMs with 400", async () => {
    const user = await createTestUser();
    const { res } = await scheduleEmails(user.id, { delayMs: -1 });
    assert.equal(res.status, 400);
  });

  it("rejects a non-positive hourlyLimit with 400", async () => {
    const user = await createTestUser();
    const { res } = await scheduleEmails(user.id, { hourlyLimit: 0 });
    assert.equal(res.status, 400);
  });

  it("rejects an empty recipients array with 400", async () => {
    const user = await createTestUser();
    const { res } = await scheduleEmails(user.id, { recipients: [] });
    assert.equal(res.status, 400);
  });
});

describe("POST /api/emails/schedule happy path", () => {
  it("creates one DB row and one deterministic delayed job per recipient", async () => {
    const user = await createTestUser();
    const { res } = await scheduleEmails(user.id);
    assert.equal(res.status, 201);
    const json = (await res.json()) as { scheduledCount: number };
    assert.equal(json.scheduledCount, 2);

    const rows = await db.email.findMany({ where: { ownerId: user.id } });
    assert.equal(rows.length, 2);

    for (const row of rows) {
      assert.equal(row.status, "scheduled");
      const job = await emailQueue.getJob(`email-${row.id}`);
      assert.ok(job, `expected a queued job for email ${row.id}`);
      const state = await job!.getState();
      assert.ok(
        ["delayed", "waiting"].includes(state),
        `expected job to be delayed/waiting, got ${state}`,
      );
    }
  });

  it("de-duplicates repeated recipients into a single row", async () => {
    const user = await createTestUser();
    const recipient = `dup-${randomUUID()}@example.com`;
    const { res } = await scheduleEmails(user.id, { recipients: [recipient, recipient] });
    assert.equal(res.status, 201);
    const json = (await res.json()) as { scheduledCount: number };
    assert.equal(json.scheduledCount, 1);
  });
});

describe("tenant isolation", () => {
  it("one user cannot list another user's emails", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    await scheduleEmails(userA.id);

    const resA = await fetch(`${baseUrl}/api/emails`, {
      headers: { Cookie: cookieHeader(userA.id) },
    });
    const jsonA = (await resA.json()) as { emails: unknown[] };
    assert.ok(jsonA.emails.length >= 2);

    const resB = await fetch(`${baseUrl}/api/emails`, {
      headers: { Cookie: cookieHeader(userB.id) },
    });
    const jsonB = (await resB.json()) as { emails: unknown[] };
    assert.equal(jsonB.emails.length, 0);
  });

  it("one user cannot search another user's emails", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const subject = `unique-subject-${randomUUID()}`;
    await scheduleEmails(userA.id, { subject });

    // Elasticsearch indexing happens synchronously in the schedule handler,
    // but allow the cluster a moment to refresh before searching.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const resA = await fetch(
      `${baseUrl}/api/emails?q=${encodeURIComponent(subject)}`,
      { headers: { Cookie: cookieHeader(userA.id) } },
    );
    const jsonA = (await resA.json()) as { emails: unknown[] };
    assert.ok(jsonA.emails.length >= 1, "owner should find their own scheduled email");

    const resB = await fetch(
      `${baseUrl}/api/emails?q=${encodeURIComponent(subject)}`,
      { headers: { Cookie: cookieHeader(userB.id) } },
    );
    const jsonB = (await resB.json()) as { emails: unknown[] };
    assert.equal(jsonB.emails.length, 0, "another tenant must not see the match");
  });
});

describe("Slack disconnect", () => {
  it("is a safe no-op when no connection exists", async () => {
    const user = await createTestUser();
    const res = await fetch(`${baseUrl}/api/integrations/slack`, {
      method: "DELETE",
      headers: { Cookie: cookieHeader(user.id) },
    });
    assert.equal(res.status, 200);

    const statusRes = await fetch(`${baseUrl}/api/integrations/slack`, {
      headers: { Cookie: cookieHeader(user.id) },
    });
    const status = (await statusRes.json()) as { connected: boolean };
    assert.equal(status.connected, false);
  });
});
