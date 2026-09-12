---
id: route-protection
title: Route Authentication and Authorization Guards
intent: developer-user-module
complexity: high
mode: validate
status: completed
depends_on:
  - authentication-login
  - seed-bootstrap
created: 2026-09-12T12:38:02Z
run_id: run-spec-driven-ai-010
completed_at: 2026-09-12T16:56:12.865Z
---

# Work Item: Route Authentication and Authorization Guards

## Description

Apply the module's own RBAC to the module's own endpoints. Satisfies FR-AC5–FR-AC7 and D-7:
every route except login requires a valid JWT, and each management route requires the permission
that governs it.

## Acceptance Criteria

- [ ] An authentication guard verifies the JWT on every route except login (FR-AC5)
- [ ] Absent, malformed, or expired token → **401** (FR-AC5)
- [ ] A permission guard requires a declared permission per route, expressed by decorator (FR-AC6)
- [ ] Valid token without the required permission → **403**, distinct from the 401 case (FR-AC7)
- [ ] Every user, role, permission, and role-permission route declares its required permission — none left unguarded by omission
- [ ] Login stays public; Swagger and health remain reachable per a documented decision
- [ ] Guards live in `api/guards/`; no permission logic inside a command or query handler (coding standards)
- [ ] Guards read permissions from the token's claims, and the resolution path is shared with `permission-resolution` rather than reimplemented
- [ ] The seeded administrator can reach every route (FR-S7 verified end to end)
- [ ] A user with an unrelated role is refused with 403 on management routes
- [ ] Swagger reflects the security requirement and documents 401/403 per route (NFR-2)
- [ ] Tests for each guard: no token, malformed token, expired token, valid token missing the permission, valid token holding it — plus an end-to-end pass with the seeded admin

## Technical Notes

This is the module's authorization boundary. FR-UI6 hides controls in the UI, but that is
usability only — enforcement lives here.

A route with no declared permission is the likely failure mode: it silently allows any
authenticated caller. Prefer a default-deny posture, where a management route without a
declared permission is refused rather than permitted, so an omission fails closed.

Token claims versus live lookup: claims are the D-2 design and avoid a query per request, but
go stale between reissues. If a guard reads live state instead, it contradicts the JWT design —
pick one in the design doc and state the consequence.

Ordering: depends on `seed-bootstrap` because the permission names the guards require are
created there.

## Dependencies

- authentication-login
- seed-bootstrap
