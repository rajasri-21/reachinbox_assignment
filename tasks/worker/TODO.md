# Worker task TODO

Mark an item complete only after the implementation or check is actually complete. Add newly discovered required work here.

## Implementation

- [ ] Create one `Worker<SendEmailJob>` for the shared `email-send` queue.
- [ ] Configure concurrency and global minimum spacing from environment values.
- [ ] Add an atomic Redis per-sender UTC-hour limit and one notification marker.
- [ ] Delay denied jobs into the next hour with `moveToDelayed` and `DelayedError`.
- [ ] Load and decrypt the current Slack webhook at notification time; missing Slack is a no-op.
- [ ] Reuse one verified pooled Ethereal transporter and persist message/preview IDs.
- [ ] Load and atomically claim DB work, skip sent rows, and update final state safely.
- [ ] Re-index sent and failed state using the same database email ID.
- [ ] Reconcile unsent scheduled rows into deterministic jobs at startup.
- [ ] Close the worker and transporter on `SIGTERM` and `SIGINT`.

## Self-review

- [ ] Worker typecheck and build pass.
- [ ] A near-future job sends through real Ethereal after becoming due.
- [ ] Concurrency greater than one still respects minimum spacing.
- [ ] An hourly limit of one delays the second job instead of failing it.
- [ ] Exactly one real Slack message is sent for a sender/hour limit event.
- [ ] A future job survives Redis/backend/worker restart and sends once.
- [ ] Reconciliation does not create duplicate jobs.
- [ ] PostgreSQL and Elasticsearch both show sent/failed state.
- [ ] The unavoidable SMTP accepted-before-DB-update window is documented.
