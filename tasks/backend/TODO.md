# Backend task TODO

Mark an item complete only after the implementation or check is actually complete. Add newly discovered required work here.

## Implementation

- [ ] Add the Express app, health route, JSON parsing, credentialed CORS, and one error handler.
- [ ] Implement Google ID-token verification, user upsert, HttpOnly session, `me`, and logout.
- [ ] Add authentication middleware for every protected route and Bull Board.
- [ ] Implement Slack OAuth state, callback, encrypted webhook storage, status, and disconnect.
- [ ] Validate schedule input and create one sender/email row per unique recipient.
- [ ] Add delayed jobs with `Queue.addBulk`, deterministic IDs, retries, and backoff.
- [ ] Index scheduled emails through `@reachinbox/search`.
- [ ] Implement tenant-filtered PostgreSQL listing and Elasticsearch `q` search.
- [ ] Mount authenticated Bull Board at `/admin/queues`.

## Self-review

- [ ] Backend typecheck and build pass.
- [ ] Unauthenticated protected routes and Bull Board return `401`.
- [ ] Invalid recipients and scheduling values return `400`.
- [ ] A valid request creates one row and deterministic delayed job per recipient.
- [ ] Tenant A cannot list or search Tenant B's emails.
- [ ] Real Google login creates an application session.
- [ ] Real Slack connect, disconnect, and reconnect work without exposing secrets.
- [ ] Slack disconnect makes later worker notification a safe no-op.
