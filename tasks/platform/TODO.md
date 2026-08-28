# Platform task TODO

Mark an item complete only after the implementation or check is actually complete. Add newly discovered required work here.

## Implementation

- [x] Add private npm workspaces and shared TypeScript configuration.
- [x] Add backend, worker, and frontend manifests without application source.
- [ ] Generate and own the single root lockfile.
- [ ] Complete and verify shared queue/API contracts.
- [ ] Complete and verify the shared Prisma schema/client.
- [ ] Complete and verify authenticated Slack-webhook encryption.
- [ ] Complete and verify the Elasticsearch mapping, indexing, and tenant search.
- [x] Add all required environment names with safe local defaults where appropriate.
- [x] Configure Redis AOF `everysec`, `noeviction`, and persistent volumes.
- [x] Document setup, architecture, persistence, limits, credentials, and trade-offs.
- [ ] Merge and integrate backend, worker, and frontend branches.

## Self-review

- [x] `docker compose config` passes.
- [ ] Prisma client generation and schema push pass against empty PostgreSQL.
- [ ] Every workspace typecheck, build, and test passes.
- [ ] Real Google login creates an authenticated session.
- [ ] Real Slack connect, disconnect, reconnect, and rate-limit notification pass.
- [ ] Scheduling creates one DB row and deterministic delayed job per recipient.
- [ ] Bull Board is inaccessible without authentication.
- [ ] A future email survives restart and sends once.
- [ ] Sent state appears in PostgreSQL, Elasticsearch, and the frontend.
- [ ] A low hourly limit delays excess work and sends one Slack alert.
- [ ] Tenant A cannot read or search Tenant B data.
