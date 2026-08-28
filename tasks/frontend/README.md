# Person 3 — Frontend Dashboard

## Mission

Build the React/TypeScript/Tailwind dashboard against the frozen HTTP contract. Own only `frontend/**` on branch `task/frontend`.

Start after Person 4's foundation commit is merged. Read the authoritative [`../../specification.md`](../../specification.md) and [`../README.md`](../README.md). Use a small API module so development can proceed with temporary local fixtures while the backend branch is incomplete.

## Deliverables

1. Google Identity Services login screen using the configured `VITE_GOOGLE_CLIENT_ID`.
2. Send the returned `credential` to `POST /api/auth/google` with credentials enabled.
3. Authenticated layout showing the user's name, email, avatar, and logout.
4. Scheduled and Sent tabs with:
   - Loading, empty, error, and populated states.
   - Recipient, sender, subject, relevant time, and status.
   - A search input backed by the `q` query parameter.
5. Compose flow with:
   - Sender email, subject, body, start time, delay, and hourly limit.
   - CSV or text-file upload.
   - Simple browser-side extraction, trimming, deduplication, and validation of email addresses.
   - Detected valid-recipient count and a clear invalid/empty-file message.
   - Schedule submission and success/error feedback.
6. Slack connection control:
   - Show connected/disconnected state.
   - Redirect to the backend connect endpoint.
   - Support disconnect and refresh status after OAuth redirect.
7. Responsive Tailwind styling close to the supplied design, without blocking functionality on polish.

## Boundaries

- Do not edit backend, worker, root, shared package, migration, or Compose files.
- Do not put Google client secrets, Slack secrets, webhook URLs, or SMTP credentials in the frontend.
- Do not parse spreadsheets or build a general CSV engine; the assignment needs email extraction from CSV/text only.
- Do not duplicate API calls inside components; keep one small typed API module.
- Do not invent endpoints beyond the frozen contract without coordinating with Person 1.

## Minimum checks

- Typecheck and build the frontend.
- Verify logged-out users see login and logged-in users see the dashboard.
- Verify user name, email, avatar, and logout.
- Verify CSV/text parsing trims, deduplicates, rejects invalid entries, and displays the valid count.
- Verify compose sends the frozen schedule payload.
- Verify loading, empty, error, scheduled, sent, and failed states.
- Verify Slack connect and disconnect controls reflect backend status.
- Check keyboard access, visible labels, focus states, and mobile layout.

## Agent handoff prompt

```text
Implement Person 3's task exactly as described in tasks/frontend/README.md. First read specification.md, tasks/README.md, and inspect the existing frontend scaffold; specification.md is authoritative. Work only in frontend/** on branch task/frontend. Use the frozen API contract and keep calls in one typed API module. Build the smallest accessible React/Tailwind UI that covers every required state. Run the minimum checks, commit the result, and report changed files, commands run, test evidence, and any visual gaps. Do not merge into main.
```

## Ready to merge when

A real Google user can enter the dashboard, connect Slack, upload leads, schedule a batch, search and switch between scheduled/sent results, see all required states, and log out.
