---
id: e2e-critical-flows
title: End-to-End Critical Flows
intent: developer-user-module
complexity: medium
mode: confirm
status: pending
depends_on: [ui-auth, ui-users, ui-roles, ui-permissions, route-protection]
created: 2026-09-12T12:38:02Z
---

# Work Item: End-to-End Critical Flows

## Description

Playwright coverage of the flows that only break when the whole stack is assembled: logging in
as the seeded administrator and driving a full access-control change through the UI to a
verified effect. Closes the E2E requirement in the testing standards and confirms FR-S7 and
FR-AC3 end to end.

## Acceptance Criteria

- [ ] Playwright configured against a running app and a seeded database; `npm run test:e2e` works
- [ ] **Login flow**: the seeded administrator signs in with credentials from environment configuration and reaches the app (FR-S3, FR-UI5)
- [ ] Login failure path: wrong password shows the uniform error and does not sign in
- [ ] **Full management flow**: create a permission → create a role → assign the permission to the role → create a user → assign the role to the user, all through the UI
- [ ] **Effect verified**: the created user's effective permissions include the assigned permission (FR-AC1, FR-AC2)
- [ ] **Deactivation flow**: deactivating the permission, the role, or the link removes it from the user's effective permissions (FR-AC3)
- [ ] **Authorization flow**: a user whose role lacks a management permission is refused — 403 handling surfaces as "not permitted", not a logout (FR-AC6, FR-AC7)
- [ ] **Admin access**: the seeded administrator can reach every management screen (FR-S7, D-7)
- [ ] Tests are independent and re-runnable — each generates uniquely-named data per run and asserts only on its own records, with no ordering dependency (**D-11**)
- [ ] No spec asserts on total row counts or "the first row", and no name is hard-coded in a way a previous run could collide with (D-11)
- [ ] No real or reused credential is hard-coded in a test file (NFR-8)

## Technical Notes

Keep this suite small and about *integration*, not coverage. Component behaviour belongs in the
Vitest tests; these exist to catch the seams — token flowing from login through the API client
to a guarded route, and a status change propagating through resolution to the UI.

The FR-AC3 deactivation path is the single most valuable assertion here: it crosses every layer
and is the requirement most likely to be implemented partially.

**Isolation is by unique per-run data** (D-11). Since nothing can be deleted (D-5), specs
generate a run-scoped suffix for every permission, role, and user name they create, and assert
only on their own records. No spec cleans up after itself, and no spec depends on the database
being empty.

A local script may reset the database for convenience, but no test may rely on it — otherwise
the suite passes locally and fails wherever data already exists.

Two consequences to respect: never assert on a total row count or "the first row in the table",
and never hard-code a name that a previous run could have created.

## Dependencies

- ui-auth
- ui-users
- ui-roles
- ui-permissions
- route-protection
