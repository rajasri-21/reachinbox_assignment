# Frontend task TODO

Mark an item complete only after the implementation or check is actually complete. Add newly discovered required work here.

## Implementation

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
