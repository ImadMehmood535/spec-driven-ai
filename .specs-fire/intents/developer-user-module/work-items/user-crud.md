---
id: user-crud
title: User Management Slice
intent: developer-user-module
complexity: high
mode: validate
status: pending
depends_on: [role-crud]
created: 2026-09-12T12:38:02Z
---

# Work Item: User Management Slice

## Description

Full vertical slice for Users, including password hashing and role assignment. Satisfies
FR-U1–FR-U5. Credential *verification* (login) is a separate work item; this one establishes
how a password is stored.

Rated high because it is the first work item that touches credentials.

## Acceptance Criteria

- [ ] `User` aggregate with private constructor, `create`/`rehydrate`, guard-backed mutation
- [ ] Aggregate enforces: `email` and `username` required and within length; `firstName`/`lastName` required; valid status
- [ ] `UserModel` maps to the `User` table with the nullable `roleId` FK
- [ ] `IUserRepository` + `USER_REPOSITORY`; repository with private `toDomain`
- [ ] `IUserQueries` + `USER_QUERIES`; **read models never include `passwordHash`** (NFR-3)
- [ ] Persistence module binds and exports both tokens
- [ ] A password hashing port + `bcrypt` implementation at cost 12, injected by token
- [ ] **Create** user (FR-U1) — hashes the supplied password; the response never contains the hash or the plaintext
- [ ] **Get by id** (FR-U2) — 404 when absent; no hash in the response
- [ ] **List** (FR-U2) — paginated, searchable on name/email/username, filterable by `entityStatus` and role
- [ ] **Update** (FR-U3) — partial update of user information; 404 when absent
- [ ] **Activate / deactivate** (FR-U4)
- [ ] **Assign role** (FR-U5) — sets `roleId`; assigning a second role *replaces* the first, never accumulates
- [ ] Assigning a non-existent role returns **404**
- [ ] `email` and `username` are each unique — duplicates return **409**
- [ ] **No delete route** (D-5)
- [ ] Password is never returned, never logged, never in a read model — verified by a test, not just by inspection
- [ ] Swagger on every route and DTO (NFR-2)
- [ ] Tests: aggregate invariants, hashing applied on create, role replacement on reassignment, uniqueness conflicts, and an explicit test that no response or read model carries `passwordHash`

## Technical Notes

**One role per user** (§6, D-0): `roleId` is a scalar column, not a join table. Reassignment
overwrites. Nothing in this slice may introduce a second role path.

The hashing port lives behind an interface so the algorithm is swappable — the brief notes
`argon2id` as the alternative to `bcrypt`.

Whether password *change* is in scope: FR-U3 says "update a user's information", and the scope
lists no password-reset flow (explicitly excluded in the brief). An administrator setting a
password at creation is required; an update path for the password itself should be decided in
the design doc and flagged if it looks like a scope change.

The login route does not exist yet, so this slice is where body redaction in the request logger
first matters — user-create carries a plaintext password.

## Dependencies

- role-crud
