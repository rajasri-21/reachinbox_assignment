# Person 1 — Backend API

## Mission

Build the authenticated Express API that stores scheduled emails in PostgreSQL and publishes BullMQ delayed jobs. Own only `backend/**` on branch `task/backend-api`.

Start after Person 4's foundation commit is merged. Read the authoritative [`../../specification.md`](../../specification.md) and [`../README.md`](../README.md) before coding, then use the shared database and contract packages without redefining them.

## Deliverables

1. Express TypeScript application with `/health`, JSON parsing, CORS credentials, validation, and one error handler.
2. Google Identity Services login:
   - Accept the frontend ID token at `POST /api/auth/google`.
   - Verify it with Google's `OAuth2Client.verifyIdToken` and the configured audience.
   - Identify users by Google's stable `sub`, not email.
   - Set a secure HttpOnly application-session cookie.
3. Auth middleware plus `/api/auth/me` and `/api/auth/logout`.
4. Slack OAuth routes:
   - Request the `incoming-webhook` scope.
   - Generate and verify OAuth `state`.
   - Store the returned webhook for the signed-in user through the shared encrypted-secret helper.
   - Support status and disconnect without exposing the webhook URL.
5. `POST /api/emails/schedule`:
   - Validate sender, recipients, future/start time, delay, and hourly limit.
   - Create one email row per recipient with `scheduledAt = startAt + index * delayMs`.
   - Add jobs with `Queue.addBulk`, delayed from the current time.
   - Use `jobId: email-<emailId>`, retry attempts, and exponential backoff.
   - Index the scheduled rows through the shared search package.
6. `GET /api/emails`:
   - Filter every query by the authenticated user.
   - Read normal lists from PostgreSQL.
   - Use Elasticsearch when `q` is present, always with the tenant/user filter.
7. Authenticated Bull Board at `/admin/queues` using `BullMQAdapter`.

## Boundaries

- Do not create another schema, Redis client contract, queue name, or Elasticsearch mapping.
- Do not implement SMTP sending or rate-limit logic; Person 2 owns it.
- Do not edit root files, shared packages, migrations, or the frontend.
- Do not log tokens, cookies, Slack webhook URLs, or email bodies.
- Do not claim exact-time delivery: delayed jobs become eligible at the scheduled time and may wait for capacity.

## Minimum checks

- Typecheck and build the backend.
- API test: unauthenticated protected routes return `401`.
- API test: invalid recipients and invalid scheduling values return `400`.
- API test: a valid request creates one DB row and one deterministic delayed job per recipient.
- API test: one user cannot list or search another user's emails.
- Confirm `/admin/queues` is inaccessible without authentication.
- Confirm Slack disconnect leaves later worker notifications as a safe no-op.

## Agent handoff prompt

```text
Implement Person 1's task exactly as described in tasks/backend/README.md. First read specification.md, tasks/README.md, and the existing shared packages; specification.md is authoritative. Work only in backend/** on branch task/backend-api. Reuse the shared DB, search, and contracts packages; do not redefine them or edit root/package-lock files. Follow the documented Google, Slack, BullMQ, and Bull Board APIs. Run the minimum checks, commit the result, and report changed files, commands run, test evidence, and known trade-offs. Do not merge into main.
```

## Ready to merge when

The API can authenticate a real Google user, connect/disconnect real Slack, schedule a batch into PostgreSQL and BullMQ, list/search only that user's emails, and expose a protected queue dashboard.
