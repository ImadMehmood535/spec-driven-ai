---
id: role-crud
title: Role Management Slice
intent: developer-user-module
complexity: medium
mode: confirm
status: completed
depends_on:
  - database-migrations
created: 2026-09-12T12:38:02Z
run_id: run-spec-driven-ai-004
completed_at: 2026-09-12T16:13:20.848Z
---

# Work Item: Role Management Slice

## Description

Full vertical slice for Roles: aggregate, model, repository, query class, CQRS features,
controller, Swagger, tests. Satisfies FR-R1–FR-R4. Assigning permissions to a role (FR-R5) is
a separate work item, since it needs the RolePermission relationship.

## Acceptance Criteria

- [ ] `Role` aggregate with private constructor, `create`/`rehydrate`, guard-backed mutation
- [ ] Aggregate enforces: `name` required and within length; `description` optional; valid status
- [ ] `RoleModel` maps to the `Role` table via `TableNames`, `timestamps: false`
- [ ] `IRoleRepository` + `ROLE_REPOSITORY`; `RoleRepository` with private `toDomain`
- [ ] `IRoleQueries` + `ROLE_QUERIES`; `RoleQueries` returning read models
- [ ] `RolePersistenceModule` binds and exports both tokens
- [ ] **Create** role (FR-R1)
- [ ] **Get by id** (FR-R2) — 404 when absent
- [ ] **List** (FR-R2) — paginated, searchable, filterable by `entityStatus`
- [ ] **Update** (FR-R3) — partial; 404 when absent
- [ ] **Activate / deactivate** (FR-R4)
- [ ] Role name is unique — duplicate returns **409**
- [ ] **No delete route** (D-5)
- [ ] Swagger on every route and DTO (NFR-2)
- [ ] Tests: aggregate invariants, handlers with mocked ports, uniqueness conflict, pagination

## Technical Notes

Deactivating a role must not cascade anything — FR-AC3 handles the consequence at resolution
time, by excluding permissions reached through an inactive role. Do not write code that
deactivates users or links when a role is deactivated.

## Dependencies

- database-migrations
