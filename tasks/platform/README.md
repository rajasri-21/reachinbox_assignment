# Person 4 — Platform, Shared Contracts, and Integration

## Mission

Create the shared foundation first, then integrate the other three branches and prove the complete system. Own root files, `packages/**`, database migrations, and the final project README on branch `task/platform`.

Read the authoritative [`../../specification.md`](../../specification.md) and [`../README.md`](../README.md) before changing the foundation.

## Foundation deliverables — first 30 minutes

1. Rename/publish the base branch as `main` if the coordinator has not already done so.
2. Add a private npm workspace for `backend`, `frontend`, `worker`, and `packages/*`.
3. Create minimal TypeScript package/app manifests and scripts so each owner can run `dev`, `typecheck`, `build`, and `test` for their workspace.
4. Own and generate the single root lockfile. Collect dependency needs from the other owners; they must not regenerate it independently.
5. Create `packages/contracts` containing only the frozen queue/API types and constants.
6. Create `packages/db` with one PostgreSQL/Drizzle schema, client, and checked-in migration for:
   - `users`: Google `sub`, email, name, avatar, timestamps.
   - `senders`: owner, email, hourly limit, timestamps.
   - `emails`: owner, sender, recipient, subject, body, status, scheduled/sent times, failure, SMTP message ID, preview URL, timestamps.
   - `slack_connections`: one per owner, encrypted webhook data, team/channel metadata, timestamps.
7. Create a small shared secret helper using authenticated encryption for Slack webhook storage. Read the key from `SLACK_TOKEN_ENCRYPTION_KEY`.
8. Create `packages/search` with the Elasticsearch client, `emails` index mapping, tenant-filtered search helper, and idempotent indexing by DB email ID.
9. Expand `.env.example` with every frozen environment name and safe local defaults where appropriate.
10. Strengthen Redis persistence with AOF `everysec` and `maxmemory-policy noeviction`.
11. Commit and merge this foundation before the other three owners create their task branches.

## Parallel and final integration work

1. Prepare real Google OAuth, Slack OAuth, and persistent Ethereal credentials early; these external settings are the likely blockers.
2. Review shared-contract questions without editing another owner's branch.
3. Merge reviewed pull requests in this order: backend, worker, frontend.
4. Resolve integration conflicts centrally; do not rewrite feature implementations unless a shared contract requires it.
5. Add root scripts for starting infrastructure and all applications.
6. Write the final project README covering setup, environment variables, architecture, persistence, concurrency, delay, rate limiting, Slack, Elasticsearch, limitations, and demo steps.

## Required integration checks

- `docker compose config` succeeds and all three infrastructure services become healthy.
- Fresh migration succeeds against an empty PostgreSQL volume.
- All workspaces typecheck, build, and pass their smallest meaningful tests.
- Real Google login creates an authenticated application session.
- Real Slack OAuth connects, disconnects, and reconnects without redeployment.
- Scheduling creates one DB row and delayed job per unique recipient.
- Bull Board shows the queue only to an authenticated user.
- A future email remains scheduled across a full application restart and sends afterward.
- A sent email appears in PostgreSQL, Elasticsearch search, and the Sent UI with its Ethereal preview URL.
- A deliberately low hourly limit delays excess jobs and generates one real Slack message.
- Tenant A cannot read or search Tenant B's emails.

## Git integration procedure

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff origin/task/backend-api
git merge --no-ff origin/task/worker
git merge --no-ff origin/task/frontend
```

Run all integration checks after the merges, then commit only the integration fixes and final documentation. Never force-push `main`.

## Agent handoff prompt

```text
Implement Person 4's task exactly as described in tasks/platform/README.md. First read specification.md and tasks/README.md completely, then inspect the current repository; specification.md is authoritative. Work on branch task/platform and own only root files, packages/**, migrations, and final integration changes. Land the smallest shared foundation first so the other three branches can start. Keep PostgreSQL as source of truth, use authenticated encryption for Slack webhook storage, and keep shared contracts minimal. After the reviewed branches are available, merge them in the documented order, run every integration check, fix only integration defects, and report commits, commands, evidence, and remaining trade-offs. Never force-push main.
```

## Ready to submit when

The clean-clone setup works, all four workstreams are integrated, the required real OAuth/Slack/Ethereal flows are demonstrated, restart and load behavior are verified, and the final README contains reproducible setup and demo instructions.
