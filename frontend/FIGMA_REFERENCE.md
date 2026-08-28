# ReachInbox Frontend — Figma Reference

## Purpose

These screenshots are the visual source of truth for the ReachInbox
frontend implementation.

The frontend should match the provided Figma design as closely as
practical.

Figma:
https://www.figma.com/design/kOTwGlESjijCYnMgtHfvfU/Outbox-Labs-Assignment

---

## Reference Screens

### 01 — Login

Reference image:

`reference/01-login.png`

Implement:
- Google Login
- ReachInbox branding
- Figma typography
- Figma spacing
- Figma colors
- Figma button styling

Google authentication must eventually use real OAuth.

---

### 02 — Dashboard

Reference image:

`reference/02-dashboard.png`

Implement the dashboard layout shown in the reference.

The dashboard should support:
- User information
- Avatar
- Email
- Logout
- Scheduled Emails
- Sent Emails
- Compose New Email

---

### 03 — Scheduled Emails

Reference image:

`reference/03-scheduled-emails.png`

Display:
- Email
- Subject
- Scheduled time
- Status

Support:
- Loading state
- Empty state
- Error state
- Populated state

---

### 04 — Sent Emails

Reference image:

`reference/04-sent-emails.png`

Display:
- Email
- Subject
- Sent time
- Status

Statuses:
- sent
- failed

Support:
- Loading state
- Empty state
- Error state
- Populated state

---

### 05 — Compose Email

Reference image:

`reference/05-compose-email.png`

The compose interface must support:

- Subject
- Body
- CSV/text upload
- Start time
- Delay between emails
- Hourly limit
- Schedule button
- Cancel button

---

### 06 — CSV Upload

Reference image:

`reference/06-csv-upload.png`

The frontend must:

1. Accept CSV/text files.
2. Parse email addresses.
3. Validate email addresses.
4. Remove duplicates.
5. Display the number of valid addresses.
6. Provide useful validation feedback.

Example:

`247 valid email addresses detected`

---

### 07 — Received / Additional Screen

Reference image:

`reference/07-received-m...png`

Use the actual screenshot as the visual reference.

Implement only the UI/behavior required by the assignment and shown in this reference.

---

# Visual Rules

When implementing the UI, pay attention to:

- Layout
- Spacing
- Padding
- Margins
- Typography
- Font sizes
- Font weights
- Colors
- Borders
- Border radius
- Shadows
- Icons
- Button dimensions
- Table dimensions
- Alignment
- Responsive behavior

Do not invent a different design when a Figma reference is available.

---

# Architecture Rules

Use:

- React
- TypeScript
- Tailwind CSS

Prefer reusable components.

Keep API calls inside service modules.

Keep TypeScript types in dedicated type files.

Do not put backend business logic inside React components.

---

# Important Restrictions

Do NOT:

- Implement email scheduling in React.
- Use setTimeout/setInterval for email scheduling.
- Send emails directly from the frontend.
- Implement rate limiting in the frontend.
- Store Google OAuth secrets in the frontend.
- Store Slack OAuth secrets in the frontend.
- Use mock authentication in the final implementation.

The frontend communicates with the backend through APIs.

---

# Implementation Order

1. Project setup
2. Application layout
3. Login
4. Dashboard
5. Scheduled Emails
6. Sent Emails
7. Compose Email
8. CSV upload
9. Search
10. Slack connection UI
11. API integration
12. Loading/error/empty states
13. Responsive refinement
14. Final Figma comparison