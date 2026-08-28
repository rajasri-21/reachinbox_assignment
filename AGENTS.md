# ReachInbox Agent Guide

This repository is a four-person, five-hour parallel implementation. Keep changes small and stay inside the assigned ownership boundary. [`specification.md`](specification.md) is the authoritative product specification; the task documents only divide its implementation between owners.

## Start here

1. Read [`specification.md`](specification.md) completely.
2. Read [`tasks/README.md`](tasks/README.md).
3. Determine the assigned task from the user's request or current branch.
4. Read exactly one task README:
   - Backend or `task/backend-api`: [`tasks/backend/README.md`](tasks/backend/README.md)
   - Worker or `task/worker`: [`tasks/worker/README.md`](tasks/worker/README.md)
   - Frontend or `task/frontend`: [`tasks/frontend/README.md`](tasks/frontend/README.md)
   - Platform/integration or `task/platform`: [`tasks/platform/README.md`](tasks/platform/README.md)
5. Read and maintain that task's `TODO.md` beside its README.
6. Run `git status --short` and inspect existing code before editing. Preserve unrelated work.
7. If the requested task is ambiguous, ask which of the four tasks to execute.

If a task document conflicts with `specification.md`, follow `specification.md` and report the mismatch to Person 4.

The user should only need to say, for example, `Implement the worker task`. The matching task README contains the complete scope and acceptance checks.

## Repository layout and ownership

```text
backend/    Person 1 only
worker/     Person 2 only
frontend/   Person 3 only
packages/   Person 4 only; shared DB, search, and contracts
tasks/      Coordination documents; Person 4 maintains them
```

- Backend agents modify only `backend/**`.
- Worker agents modify only `worker/**`.
- Frontend agents modify only `frontend/**`.
- Platform agents own root configuration, `packages/**`, migrations, the root lockfile, and final integration.
- Each owner may edit only its matching `tasks/<task>/TODO.md`; this is the sole exception to Person 4's ownership of `tasks/**`.
- Never edit another owner's files merely to make a local task easier. Report a required contract change to Person 4.

## Required architecture

- TypeScript throughout; Express backend; React/Tailwind frontend.
- PostgreSQL is the source of truth.
- BullMQ delayed jobs in Redis perform scheduling. Never use cron or `QueueScheduler`.
- Queue name is `email-send`; payload is only `{ emailId: string }`.
- Use deterministic BullMQ job IDs: `email-<database-id>`.
- Elasticsearch is a tenant-filtered search projection, not authoritative storage.
- The worker owns Ethereal SMTP, concurrency, minimum send spacing, atomic Redis hourly limits, retries, rescheduling, and Slack rate-limit notifications.
- Google and Slack flows must be real OAuth integrations; do not mock them in the completed flow.
- Secrets stay server-side and out of source control, logs, API responses, and frontend bundles.

## Dependency and branch rules

- Person 4's foundation commit must land before the backend, worker, and frontend branches begin.
- Use the branch named by the task README. Do not implement directly on `main`.
- Only Person 4 updates the root `package-lock.json`. Other owners request missing dependencies instead of creating lockfile conflicts.
- Never force-push or merge your own task into `main`.
- Rebase once onto the latest `origin/main`, push the task branch, and hand it to Person 4 for review and merge.

## Implementation rules

- Keep the matching `tasks/<task>/TODO.md` current. Preserve separate `Implementation` and `Self-review` sections, add newly discovered required work, and mark `[x]` only after that item is actually implemented or its check has actually passed.
- Reuse shared packages and frozen contracts; do not create competing schemas, clients, types, queue names, or environment variables.
- Validate every API trust boundary and filter all user-owned data by the authenticated user.
- Prefer the smallest implementation that satisfies the assigned acceptance checks. Do not add speculative abstractions or unrelated cleanup.
- Preserve restart behavior and idempotency. A rate-limited job must be delayed, never dropped.
- Add the smallest meaningful automated check for non-trivial logic.
- Update documentation only when behavior or setup changes.

## Before handoff

1. Reconcile the task README against the matching TODO and leave unfinished items unchecked.
2. Run the task README's minimum checks.
3. Run the owned workspace's typecheck, tests, and build when those scripts exist.
4. Run `git diff --check` and review `git diff --stat`.
5. Confirm the diff contains only owned files plus its own TODO.
6. Commit with a focused message and push the task branch if a remote is configured.
7. Report:
   - Changed files and behavior.
   - Commands and checks run.
   - Real integrations verified versus blocked by missing credentials.
   - Remaining risks or documented trade-offs.

Do not claim a real OAuth, Slack, SMTP, restart, or load test passed unless it was actually executed.
