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

## Implementation (full scope — later phases)

- [ ] Add real Google Identity Services login and send the credential to the backend.
- [ ] Show authenticated user name, email, avatar, and logout.
- [ ] Build Scheduled and Sent tabs with loading, empty, error, and populated states.
- [ ] Keep backend calls in one typed API module with credentials enabled.
- [ ] Build the compose flow for sender, subject, body, start, delay, and hourly limit.
- [ ] Extract, trim, validate, and deduplicate addresses from CSV/text files.
- [ ] Show detected count and invalid/empty-file feedback.
- [ ] Submit the frozen scheduling payload and display success/error feedback.
- [ ] Add Slack connection status, connect redirect, and disconnect behavior.
- [ ] Add responsive accessible Tailwind styling.

## Self-review

- [ ] Frontend typecheck and production build pass.
- [ ] Logged-out users see login; logged-in users see the dashboard.
- [ ] User identity and logout work with a real Google login.
- [ ] Recipient parsing handles trimming, duplicates, invalid values, and empty files.
- [ ] Compose submits the exact frozen schedule contract.
- [ ] Scheduled, sent, failed, loading, empty, and error states are verified.
- [ ] Real Slack connect/disconnect state is reflected after OAuth redirect.
- [ ] Keyboard access, visible labels, focus states, and mobile layout are checked.

## Phase 1 Self-review

- [x] Typecheck passes (npm run typecheck -w @reachinbox/frontend)
- [x] Production build passes (npm run build -w @reachinbox/frontend)
- [x] Dev server loads without runtime errors
- [x] Visual comparison against 01-login.png and 02-dashboard.png done
- [x] Only frontend/** + tasks/frontend/TODO.md modified (git diff --stat)
- [x] No backend/worker/packages/root config changes
