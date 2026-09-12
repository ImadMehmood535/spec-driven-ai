---
id: seed-bootstrap
title: Seeds — Permissions, Admin Role, First Administrator
intent: developer-user-module
complexity: high
mode: validate
status: completed
depends_on:
  - user-crud
  - role-permission-assignment
created: 2026-09-12T12:38:02Z
run_id: run-spec-driven-ai-009
completed_at: 2026-09-12T16:48:57.058Z
---

# Work Item: Seeds — Permissions, Admin Role, First Administrator

## Description

Idempotent seeds that make the system usable from a cold start: the permission catalogue, an
administrator role holding every permission, and the first administrator user. Satisfies
FR-S1–FR-S7 and resolves the §2 bootstrap problem.

Rated high because it creates the most privileged account in the system.

## Acceptance Criteria

- [ ] Seeds live in `seeders/`, separate from migrations, and are independently runnable (FR-S5)
- [ ] `npm` script runs the seeds
- [ ] **Permission catalogue** seeded with the §5 action names: `project.create`, `project.update`, `project.delete`, `project.view` (FR-S1)
- [ ] **This module's own permission names** seeded — the ones the route guards will require for user, role, permission, and role-permission operations (FR-S6)
- [ ] Module permission names follow one documented convention, consistent with the §5 `resource.action` shape
- [ ] **Administrator role** created (FR-S2)
- [ ] The admin role is linked to **every** permission the module defines, so the administrator has full access (FR-S7, D-7)
- [ ] **First administrator user** created and assigned the admin role (FR-S3)
- [ ] Administrator credentials read from environment configuration — never hard-coded, never committed (FR-S3, NFR-8)
- [ ] The seeded password is stored hashed, through the same hashing port as user creation
- [ ] Seeds **fail loudly** when the admin credential variables are absent — no default password
- [ ] **Idempotent** (FR-S4): running twice creates no duplicate permission, role, user, or link
- [ ] Re-running does **not** reset an existing administrator's password (FR-S4)
- [ ] Re-running after new permissions are added grants those to the admin role too, so FR-S7 keeps holding
- [ ] Tests: first run creates everything; second run changes nothing; absent credentials fail; admin resolves to the full permission set via `permission-resolution`

## Technical Notes

FR-S7 and FR-S6 interact: the admin must hold every permission *including* the module's own
route permissions, or the administrator would be locked out of the very endpoints that manage
access. Verify by resolving the seeded admin's permissions and comparing against the full
permission table, not by trusting the seed's insert list.

Idempotency by natural key — permission `name`, role `name`, user `email`/`username` — not by
id, since ids differ between environments.

This work item must land **before** `route-protection`: the guards require permission names
that only the seed creates.

The seeded administrator is a real credential in every environment it runs. Treat the
environment variables as production secrets.

## Dependencies

- user-crud
- role-permission-assignment
