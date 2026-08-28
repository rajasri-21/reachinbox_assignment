# Parallel Implementation Guide

This folder divides the requirements in [`../specification.md`](../specification.md) between four owners. The specification is authoritative; these documents only assign ownership and integration boundaries. Each owner can give their task README to a coding agent and work on a separate branch.

## Five-hour schedule

| Time | Work |
| --- | --- |
| 0:00–0:30 | Person 4 creates the shared workspace, database schema, contracts, environment template, and dependency lockfile. Merge this foundation first. |
| 0:30–4:00 | People 1–4 work on their exclusive areas in parallel. |
| 4:00–5:00 | Person 4 integrates, runs the end-to-end checks, resolves only integration conflicts, and updates the final README. |

## Ownership

| Owner | Branch | Exclusive ownership |
| --- | --- | --- |
| [Person 1: Backend API](backend/README.md) | `task/backend-api` | `backend/**` |
| [Person 2: Worker](worker/README.md) | `task/worker` | `worker/**` |
| [Person 3: Frontend](frontend/README.md) | `task/frontend` | `frontend/**` |
| [Person 4: Platform and integration](platform/README.md) | `task/platform` | root files, `packages/**`, migrations, final integration |

Do not edit another owner's files without asking them. Only Person 4 changes the root lockfile, Compose file, shared packages, migrations, or final project README.

## Task TODO ledgers

Every owner must maintain the `TODO.md` beside its task README:

- Backend: [`backend/TODO.md`](backend/TODO.md)
- Worker: [`worker/TODO.md`](worker/TODO.md)
- Frontend: [`frontend/TODO.md`](frontend/TODO.md)
- Platform: [`platform/TODO.md`](platform/TODO.md)

Each ledger keeps separate `Implementation` and `Self-review` sections. Add required work discovered during implementation, but mark `[x]` only after the implementation is complete or the named check has actually passed. Unavailable credentials, an unrun integration, or code that merely looks correct stays unchecked. Each task owner may edit only its own TODO file; Person 4 continues to own every other file under `tasks/**`.

## One-time repository setup

The repository currently starts on `master`. The coordinator should rename it before parallel work:

```bash
git branch -m master main
git push -u origin main
```

Person 4 then lands the foundation commit. Every other owner branches from that updated `main`:

```bash
git switch main
git pull --ff-only origin main
git switch -c task/<task-name>
```

## Frozen shared contract

### Data ownership

- PostgreSQL is the source of truth.
- Redis/BullMQ owns delayed execution, retries, and rate-limit counters.
- Elasticsearch is a searchable projection, never the source of truth.
- One database row and one BullMQ job represent one recipient email.

### Shared types

```ts
export const EMAIL_QUEUE = "email-send";

export type EmailStatus = "scheduled" | "processing" | "sent" | "failed";

export type SendEmailJob = {
  emailId: string;
};
```

The queue payload contains only `emailId`; the worker loads current email and sender data from PostgreSQL.

### HTTP contract

All protected endpoints use an HttpOnly application-session cookie.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/google` | Verify `{ credential }`, create/update the user, and set the session cookie |
| `GET` | `/api/auth/me` | Return the signed-in user |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/integrations/slack` | Return connection status without exposing secrets |
| `GET` | `/api/integrations/slack/connect` | Start Slack OAuth |
| `GET` | `/api/integrations/slack/callback` | Complete Slack OAuth and store the connection |
| `DELETE` | `/api/integrations/slack` | Disconnect Slack |
| `POST` | `/api/emails/schedule` | Store recipient emails and add delayed BullMQ jobs |
| `GET` | `/api/emails` | List by `status`, with optional `q`, `page`, and `limit` |
| `GET` | `/admin/queues` | Authenticated Bull Board dashboard |
| `GET` | `/health` | Backend health check |

Schedule request:

```json
{
  "senderEmail": "sender@example.com",
  "subject": "Hello",
  "body": "Email body",
  "recipients": ["lead@example.com"],
  "startAt": "2026-08-28T12:00:00.000Z",
  "delayMs": 2000,
  "hourlyLimit": 200
}
```

Schedule response:

```json
{ "scheduledCount": 1 }
```

Email list responses must include `id`, `recipient`, `senderEmail`, `subject`, `scheduledAt`, `sentAt`, `status`, `failureReason`, and `previewUrl`.

### Required environment names

```text
DATABASE_URL
REDIS_URL
ELASTICSEARCH_URL
BACKEND_URL
FRONTEND_URL
GOOGLE_CLIENT_ID
VITE_GOOGLE_CLIENT_ID
VITE_API_URL
SESSION_SECRET
SLACK_CLIENT_ID
SLACK_CLIENT_SECRET
SLACK_REDIRECT_URI
SLACK_TOKEN_ENCRYPTION_KEY
ETHEREAL_HOST
ETHEREAL_PORT
ETHEREAL_USER
ETHEREAL_PASS
WORKER_CONCURRENCY
MIN_SEND_DELAY_MS
MAX_EMAILS_PER_HOUR
```

## Shared implementation rules

- No cron jobs and no `QueueScheduler`; BullMQ delayed jobs handle scheduling.
- Use deterministic job IDs: `email-<database-id>`.
- PostgreSQL status checks remain the permanent duplicate-send guard.
- Use `Queue.addBulk` for scheduling recipient batches.
- Rate-limit counters and the one-notification marker must be atomic in Redis.
- A rate-limited job is delayed to the next hour; it is never discarded.
- Protect Bull Board and every tenant-owned query with authentication.
- Never expose session secrets, Slack webhook URLs, SMTP credentials, or cross-tenant search results.
- Do not remove completed BullMQ jobs immediately; removal allows the same job ID to be reused.

## Pull request and merge rules

Each owner:

1. Reconciles its README with its TODO and leaves unfinished work unchecked.
2. Runs the checks listed in its task README.
3. Commits only owned files plus its own TODO.
4. Rebases once on the latest `origin/main` before opening the pull request.
5. Pushes the task branch and opens a pull request with test evidence and remaining trade-offs.
6. Leaves final merging to Person 4 after review.

Person 4 merges platform foundation first, then backend, worker, and frontend. The final integration commit must demonstrate login, Slack connection, scheduling, restart persistence, sending, search, and rate-limit rescheduling.

## Primary references

- [BullMQ delayed jobs](https://docs.bullmq.io/guide/jobs/delayed)
- [BullMQ job IDs](https://docs.bullmq.io/guide/jobs/job-ids)
- [BullMQ worker concurrency](https://docs.bullmq.io/guide/workers/concurrency)
- [BullMQ rate limiting](https://docs.bullmq.io/guide/rate-limiting)
- [Google ID-token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Slack OAuth](https://docs.slack.dev/authentication/installing-with-oauth/)
- [Nodemailer with Ethereal](https://nodemailer.com/guides/testing-with-ethereal)
- [Elasticsearch JavaScript client](https://www.elastic.co/docs/reference/elasticsearch/clients/javascript/getting-started)
