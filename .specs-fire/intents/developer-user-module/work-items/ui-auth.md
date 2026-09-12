---
id: ui-auth
title: Login and Session Handling
intent: developer-user-module
complexity: high
mode: validate
status: pending
depends_on: [ui-shared-components, authentication-login]
created: 2026-09-12T12:38:02Z
---

# Work Item: Login and Session Handling

## Description

The login screen and everything that follows from holding a token: session state, attaching the
token to requests, redirecting unauthenticated users, and reacting to expiry. Satisfies FR-UI5
and the client half of FR-UI6.

Rated high because token handling in a browser is a security decision, not a layout one.

## Acceptance Criteria

- [ ] Login page with identifier and password fields, validated before submit (FR-UI9)
- [ ] Failed login shows one clear message that does **not** reveal whether the account exists — mirroring the server's uniform 401
- [ ] Submit disables while pending and shows progress; no double submission (FR-UI7)
- [ ] Successful login stores the token by the documented mechanism and redirects to the app
- [ ] Token attached to every API request through the single seam created in `ui-scaffold`
- [ ] Unauthenticated access to any management route redirects to login
- [ ] A **401** from any request clears the session and returns the user to login
- [ ] A **403** surfaces as a "not permitted" message, not a logout (distinct handling, per FR-AC7)
- [ ] Expired token handled without an infinite redirect loop
- [ ] Sign-out clears the stored token and all cached query data — no stale data for the next user
- [ ] Permission claims decoded once and exposed via `usePermissions` for FR-UI6 gating
- [ ] The password is never logged, never placed in a query string, and never persisted anywhere but the session store
- [ ] Login page is responsive, keyboard-operable, and correct in dark mode (FR-UI10, UI11, UI12)
- [ ] Tests: successful login, failed login message, pending state, redirect when unauthenticated, 401 clears session, 403 does not, sign-out clears cache, and an axe assertion

## Technical Notes

**Token storage is the decision to make deliberately in the design doc.** `localStorage` is
readable by any script that gets injected; an in-memory store dies on refresh; a cookie needs
`httpOnly`/`SameSite` handling the API must cooperate with. D-2 specifies a JWT but not where
the browser keeps it. State the choice and its trade-off rather than defaulting silently.

Clearing the TanStack Query cache on sign-out matters: without it, the next user on the same
browser can see the previous user's data from cache.

No refresh-token flow exists (D-2), so expiry means re-login. Handle it cleanly instead of
leaving the user on a broken screen.

## Dependencies

- ui-shared-components
- authentication-login
