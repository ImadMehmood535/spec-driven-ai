---
id: authentication-login
title: Credential Verification and JWT Login
intent: developer-user-module
complexity: high
mode: validate
status: pending
depends_on: [permission-resolution]
created: 2026-09-12T12:38:02Z
---

# Work Item: Credential Verification and JWT Login

## Description

Authenticate a user by verifying their credentials and issue a JWT carrying their identity and
effective permissions. Satisfies FR-U6, FR-U7, and D-2.

## Acceptance Criteria

- [ ] Login route accepts an identifier and password and returns a signed JWT on success
- [ ] Password verified against the stored `bcrypt` hash (FR-U6)
- [ ] Wrong password returns **401**
- [ ] Unknown user returns **401** — indistinguishable from a wrong password, no user enumeration
- [ ] An **inactive user cannot authenticate** (FR-U7) — also 401, with no hint that the account exists
- [ ] JWT claims carry: subject (`globalUId`), `username`, role name (absent when no role), and effective permission names (D-2)
- [ ] Permission claims come from `permission-resolution`, so every FR-AC3 exclusion applies to the token
- [ ] `JWT_SECRET` and `JWT_EXPIRES_IN` are read from environment configuration; neither is hard-coded (NFR-8)
- [ ] App fails fast at boot when `JWT_SECRET` is missing — no insecure default
- [ ] An expired token is rejected wherever tokens are verified
- [ ] The request logger **redacts the login request body** — no plaintext password reaches stdout (NFR-3)
- [ ] No refresh token, logout, revocation, or password-reset route (D-2 — each is a scope change)
- [ ] Swagger documents the route and its failure responses (NFR-2)
- [ ] Tests: correct credentials, wrong password, unknown user, inactive user, missing secret at boot, expired token, claim contents, and that no log line contains the password

## Technical Notes

Uniform 401s matter: distinguishing "unknown user" from "wrong password" hands an attacker a
user-enumeration oracle. Keep one message and one status for every failure, and resist adding a
more "helpful" error later.

Embedding permissions in the token means a permission change does not take effect until the
token is reissued. That is the accepted consequence of D-2's stateless design — no revocation
is in scope. Note it in the design doc so it is a known trade-off rather than a surprise.

Timing: verify the hash even when the user is absent, or the endpoint leaks account existence
through response time.

## Dependencies

- permission-resolution
