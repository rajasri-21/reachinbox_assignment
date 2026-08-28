# Person 2 — BullMQ Worker

## Mission

Build the persistent email-delivery worker with concurrency, throttling, hourly limits, retries, Slack notification, and status/search updates. Own only `worker/**` on branch `task/worker`.

Start after Person 4's foundation commit is merged. Read the authoritative [`../../specification.md`](../../specification.md) and [`../README.md`](../README.md), then consume the shared database, search, and queue contracts.

## Deliverables

1. One BullMQ `Worker<SendEmailJob>` for the shared `email-send` queue.
2. Configurable `WORKER_CONCURRENCY`.
3. Global minimum spacing using BullMQ's worker limiter with `max: 1` and `duration: MIN_SEND_DELAY_MS`.
4. Atomic Redis per-sender hourly limiting:
   - Key counters by sender and UTC hour.
   - Use one Lua operation to increment/set expiry and return allow/deny.
   - Respect the lower of the sender's configured limit and `MAX_EMAILS_PER_HOUR`.
   - When denied, move the job to the next hour with `moveToDelayed(...)` and throw `DelayedError`.
   - Set a Redis marker so only one Slack notification is sent per sender/hour limit event.
5. Slack notification:
   - Load and decrypt the current user's stored incoming webhook at send time.
   - Post with built-in `fetch` only when Slack is connected.
   - Missing/disconnected Slack must never fail the email job.
6. Ethereal/Nodemailer:
   - Create and reuse one pooled transporter per worker process.
   - Use credentials from environment variables; do not create a new test account on every restart.
   - Call `verify()` at startup.
   - Store the SMTP `messageId` and Ethereal preview URL.
7. Safe processing:
   - Load current state from PostgreSQL using `emailId`.
   - Skip rows already marked `sent`.
   - Atomically claim work before SMTP sending.
   - Update PostgreSQL and re-index the same email ID as `sent` or final `failed`.
8. Restart reconciliation:
   - At startup, find unsent scheduled rows and re-add their deterministic jobs.
   - Re-adding an existing deterministic BullMQ job must be harmless.
   - No cron and no `QueueScheduler`.
9. Graceful shutdown on `SIGTERM` and `SIGINT` with `worker.close()` and transporter close.

## Boundaries

- Do not define a second database schema, job payload, queue name, or search mapping.
- Do not change backend routes, frontend code, root files, or migrations.
- Do not use in-memory hourly counters; multiple worker instances must remain safe.
- Do not permanently fail or discard a rate-limited job.
- SMTP cannot guarantee strict exactly-once delivery if the process dies after SMTP accepts a message but before the DB update. Minimize this window and document it honestly.

## Minimum checks

- Typecheck and build the worker.
- Schedule one near-future job and verify it sends after becoming due.
- Run with concurrency greater than one and verify the configured minimum spacing.
- Set an hourly limit of one, enqueue two jobs, and verify the second is delayed rather than failed.
- Verify only one Slack message is delivered for the sender/hour limit event.
- Restart Redis/backend/worker with a future job and verify it remains scheduled and sends once.
- Re-run reconciliation and verify it does not create duplicate queue jobs.
- Verify sent/failed state is reflected in PostgreSQL and Elasticsearch.

## Agent handoff prompt

```text
Implement Person 2's task exactly as described in tasks/worker/README.md. First read specification.md, tasks/README.md, and the shared packages; specification.md is authoritative. Work only in worker/** on branch task/worker. Use the shared DB, search, and contracts packages; do not redefine them or edit root/package-lock files. Use BullMQ delayed jobs, an atomic Redis rate-limit operation, and a reused Ethereal transporter. Run every feasible minimum check, commit the result, and report changed files, commands run, evidence, and the SMTP exactly-once trade-off. Do not merge into main.
```

## Ready to merge when

A scheduled job survives restarts, respects minimum spacing and per-sender hourly limits across workers, notifies connected Slack once when limited, sends through Ethereal, and updates both PostgreSQL and Elasticsearch.
