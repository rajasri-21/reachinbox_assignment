# Backend task TODO

Mark an item complete only after the implementation or check is actually complete. Add newly discovered required work here.

## Implementation

- [x] Add the Express app, health route, JSON parsing, credentialed CORS, and one error handler.
- [x] Implement Google ID-token verification, user upsert, HttpOnly session, `me`, and logout.
- [x] Add authentication middleware for every protected route and Bull Board.
- [x] Implement Slack OAuth state, callback, encrypted webhook storage, status, and disconnect.
- [x] Validate schedule input and create one sender/email row per unique recipient.
- [x] Add delayed jobs with `Queue.addBulk`, deterministic IDs, retries, and backoff.
- [x] Index scheduled emails through `@reachinbox/search`.
- [x] Implement tenant-filtered PostgreSQL listing and Elasticsearch `q` search.
- [x] Mount authenticated Bull Board at `/admin/queues`.

## Self-review

- [x] Backend typecheck and build pass.
- [x] Unauthenticated protected routes and Bull Board return `401`.
- [x] Invalid recipients and scheduling values return `400`.
- [x] A valid request creates one row and deterministic delayed job per recipient.
- [x] Tenant A cannot list or search Tenant B's emails.
- [ ] Real Google login creates an application session. Blocked: no real `GOOGLE_CLIENT_ID`/credential available in this environment; `/api/auth/google` is implemented against `OAuth2Client.verifyIdToken` but only exercised with a fabricated session cookie in tests, not a real Google token.
- [ ] Real Slack connect, disconnect, and reconnect work without exposing secrets. Blocked: no real `SLACK_CLIENT_ID`/`SLACK_CLIENT_SECRET` available; OAuth state generation/verification and the disconnect no-op are tested, the live Slack token exchange is not.
- [x] Slack disconnect makes later worker notification a safe no-op (DELETE removes the `slack_connections` row so a later status check/worker lookup finds nothing; verified by test).
