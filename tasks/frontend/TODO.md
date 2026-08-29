# Frontend task TODO

Mark an item complete only after the implementation or check is actually complete. Add newly discovered required work here.

## Phase 1 — Frontend Foundation (current scope)

- [x] Configure Vite + React + TypeScript (verify vite.config.ts, index.html)
- [x] Configure Tailwind CSS v4 via @tailwindcss/vite (verify build)
- [x] Create clean frontend folder structure (components/, pages/, services/, hooks/, types/, utils/)
- [x] Create reusable UI components (Button, Input, Card, Badge, Tabs, Avatar)
- [x] Build application layout (sidebar + header + main shell)
- [x] Build Login page per 01-login.png (Google button, branding, spacing, colors, radius)
- [x] Build Dashboard shell per 02-dashboard.png (sidebar logo ONB, user card, Compose, CORE nav)
- [x] Build header/user area + Scheduled/Sent navigation tabs (counts, active state, icons)
- [x] Use simple tab state (no routing) and compare against Figma for layout/spacing/typography/colors/borders/shadows
- [x] Run TypeScript typecheck, production build, dev server smoke test, git diff review

## Phase 2 — Main Dashboard + Email Views

- [x] Scheduled Emails view: table with recipient/subject/scheduledAt/status via EmailListItem/EmailStatus contract
- [x] Scheduled states: loading, empty ("No scheduled emails" + Compose CTA), error, populated
- [x] Sent Emails view: table with recipient/subject/sentAt/status (sent/failed), failureReason, previewUrl (new tab, rel noopener)
- [x] Sent states: loading, empty ("No sent emails"), error, populated
- [x] Pagination: Previous/Next, current page, page of total, showing X–Y of Z, respects backend page/limit
- [x] Search UI: input with debounced q param, scheduled/sent uses status=scheduled|sent + q + page/limit per frozen contract
- [x] Compose New Email button: primary placement per Figma, wired for Phase 3 (placeholder alert), not implementing form/CSV yet
- [x] API client extended (typed getEmails, credentials:include, VITE_API_URL, 401/400/500 handling, no any)
- [x] Reusable components: EmailTable, EmailStatusBadge, SearchInput, Pagination, LoadingState, EmptyState, ErrorState
- [x] Reused Phase 1 shell (Sidebar/AppLayout) extended, not rewritten; responsive table overflow, focus/keyboard/a11y checked

## Phase 3 — Compose New Email + CSV/Text Lead Upload (current scope)

- [x] Create frontend/src/lib/csv.ts with typed parseLeads(text) — comma/newline split, trim, ignore empties, validate, dedupe case-insensitively preserving first casing, return { valid, invalid }
- [x] Extend frontend/src/services/api.ts with scheduleEmails(payload: ScheduleEmailRequest) POST /api/emails/schedule, credentials:include, VITE_API_URL, typed errors, no any
- [x] Build ComposeEmail modal/drawer component (frontend/src/components/compose/ComposeEmail.tsx) matching 05-compose-email.png / 06-csv-upload.png: overlay, focus trap/return, Esc + close button, accessible labels, focus states, responsive
- [x] Implement compose form fields with validation: senderEmail (required, email format, trim), subject (required trim), body (required trim textarea), startAt (datetime-local required future -> ISO8601), delayMs (int 0-86400000, ms unit), hourlyLimit (int 1-100000)
- [x] Implement CSV/TXT upload via FileReader.readAsText(), accept .csv .txt, parse via parseLeads, display valid count (e.g. "245 emails detected"), invalid count/list, empty-file error, no-valid-emails error, >5000 guard
- [x] Wire Compose New Email button in App/Sidebar to open modal (replace Phase 2 alert), handle cancel/close reset, loading state (disable Schedule, spinner, prevent double submit), preserve values on error
- [x] Handle API responses: 201 show success "Successfully scheduled ${count} emails." + close/reset + refresh Scheduled tab; 400 show validation error; 401 redirect/login; 500/network show error
- [x] Keep user on dashboard, no full reload; add toast/feedback component reused

## Implementation (full scope — later phases)

- [ ] Add real Google Identity Services login and send the credential to the backend.
- [ ] Show authenticated user name, email, avatar, and logout.
- [x] Build Scheduled and Sent tabs with loading, empty, error, and populated states.
- [x] Keep backend calls in one typed API module with credentials enabled.
- [x] Build the compose flow for sender, subject, body, start, delay, and hourly limit.
- [x] Extract, trim, validate, and deduplicate addresses from CSV/text files.
- [x] Show detected count and invalid/empty-file feedback.
- [x] Submit the frozen scheduling payload and display success/error feedback.
- [ ] Add Slack connection status, connect redirect, and disconnect behavior.
- [x] Add responsive accessible Tailwind styling.

## Self-review

- [x] Frontend typecheck and production build pass.
- [ ] Logged-out users see login; logged-in users see the dashboard.
- [ ] User identity and logout work with a real Google login.
- [x] Recipient parsing handles trimming, duplicates, invalid values, and empty files.
- [x] Compose submits the exact frozen schedule contract.
- [x] Scheduled, sent, failed, loading, empty, and error states are verified.
- [ ] Real Slack connect/disconnect state is reflected after OAuth redirect.
- [x] Keyboard access, visible labels, focus states, and mobile layout are checked.

## Phase 1 Self-review

- [x] Typecheck passes (npm run typecheck -w @reachinbox/frontend)
- [x] Production build passes (npm run build -w @reachinbox/frontend)
- [x] Dev server loads without runtime errors
- [x] Visual comparison against 01-login.png and 02-dashboard.png done
- [x] Only frontend/** + tasks/frontend/TODO.md modified (git diff --stat)
- [x] No backend/worker/packages/root config changes
