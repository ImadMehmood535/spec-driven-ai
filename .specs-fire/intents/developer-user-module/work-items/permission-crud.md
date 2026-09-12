---
id: permission-crud
title: Permission Management Slice
intent: developer-user-module
complexity: medium
mode: validate
status: pending
depends_on: [database-migrations]
created: 2026-09-12T12:38:02Z
---

# Work Item: Permission Management Slice

## Description

Full vertical slice for Permissions: aggregate, Sequelize model, repository, query class, CQRS
features, controller, Swagger, tests. Satisfies FR-P1–FR-P5.

Permissions come first because they depend on nothing else in the model.

## Acceptance Criteria

- [ ] `Permission` aggregate with private constructor, `create`/`rehydrate`, and guard-backed mutation
- [ ] Aggregate enforces: `name` required and within length; `description` optional; status must be a valid `EntityStatus`
- [ ] `PermissionModel` maps to the `Permission` table via `TableNames`, `timestamps: false`
- [ ] `IPermissionRepository` + `PERMISSION_REPOSITORY` symbol; `PermissionRepository` maps rows via a private `toDomain`
- [ ] `IPermissionQueries` + `PERMISSION_QUERIES` symbol; `PermissionQueries` returns flat read models via `toReadModel`
- [ ] `PermissionPersistenceModule` binds both tokens and exports them
- [ ] **Create** permission (FR-P1) — feature slice with Command, Handler, Request, Response
- [ ] **Get by id** (FR-P2) — 404 when absent
- [ ] **List** (FR-P2) — paginated, with text search on `name`/`description` and an `entityStatus` filter
- [ ] **Update** (FR-P3) — partial update; 404 when absent
- [ ] **Activate / deactivate** (FR-P4) — status change, reachable from the update route or a dedicated one
- [ ] Permission name is unique — a duplicate returns **409** (ConflictError)
- [ ] `name` holds the action name, e.g. `project.create` (FR-P5)
- [ ] **No delete route** (D-5)
- [ ] Swagger decorators on every route and every Request/Response class (NFR-2)
- [ ] Tests: aggregate invariants, each handler with a mocked port, uniqueness conflict, pagination

## Technical Notes

The controller stays thin — build the command or query, dispatch on the bus, return. No
repository or model access from `api/`.

Uniqueness is checked in the handler via a repository `nameExists(name, exceptId?)` call, then
enforced by the DB constraint as the real guarantee — mirroring the reference's `slugExists`.

Activate/deactivate is a status transition on the aggregate (`changeStatus`), not a separate
entity concept.

## Dependencies

- database-migrations
