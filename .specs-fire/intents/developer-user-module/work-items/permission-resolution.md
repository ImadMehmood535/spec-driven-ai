---
id: permission-resolution
title: Effective Permission Resolution
intent: developer-user-module
complexity: high
mode: validate
status: pending
depends_on: [user-crud, role-permission-assignment]
created: 2026-09-12T12:38:02Z
---

# Work Item: Effective Permission Resolution

## Description

The capability the whole module exists to provide: given a user, determine the actions they may
perform. Satisfies FR-AC1–FR-AC4 and success criterion §9.6.

Resolution walks `User → Role → RolePermissions → Permissions`, honouring `entityStatus` at
every hop.

## Acceptance Criteria

- [ ] A query returns a user's effective permission names (FR-AC1, FR-AC2)
- [ ] A check operation answers whether a given user has a given permission name (FR-AC1)
- [ ] Permissions resolve **only** through the user's assigned role (FR-AC2) — no direct user-permission path exists
- [ ] A user with `roleId` null resolves to an empty permission set (FR-AC4)
- [ ] An **inactive user** resolves to no permissions (FR-AC3)
- [ ] An **inactive role** contributes no permissions (FR-AC3)
- [ ] An **inactive permission** is excluded even when its link is active (FR-AC3)
- [ ] An **inactive role-permission link** is excluded even when role and permission are both active (FR-AC3)
- [ ] Resolution is a single query, not N+1 across links
- [ ] Exposed as a documented route other modules can call (§9.6) with Swagger (NFR-2)
- [ ] Unknown user id returns **404**, not an empty permission set — absent and unpermitted are different answers
- [ ] Tests cover every FR-AC3 combination independently: inactive user, inactive role, inactive permission, inactive link, and all-active as the control

## Technical Notes

This is the security core. The four independent `entityStatus` gates are the part most likely
to be implemented partially — each needs its own test, not one combined case.

Read side only: a query class returning a flat permission-name list. No aggregate rehydration
and no repository, per the CQRS split.

The permission *name* is the contract other modules use (`project.create`), not the numeric id.

Resolution output feeds two later work items — the JWT claims in `authentication-login` and the
route guards in `route-protection` — so its shape should serve both.

## Dependencies

- user-crud
- role-permission-assignment
