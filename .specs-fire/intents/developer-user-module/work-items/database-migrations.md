---
id: database-migrations
title: Schema Migrations for the Four Tables
intent: developer-user-module
complexity: high
mode: validate
status: completed
depends_on:
  - project-scaffold
created: 2026-09-12T12:38:02Z
run_id: run-spec-driven-ai-002
completed_at: 2026-09-12T16:00:53.409Z
---

# Work Item: Schema Migrations for the Four Tables

## Description

Set up migration tooling and create the schema for all four tables — Users, Roles, Permissions,
Role Permissions — exactly as decided in the brief's *Data Model*. One work item rather than
four, because the foreign keys and unique constraints only make sense together.

## Acceptance Criteria

- [ ] `sequelize-cli` wired with a checked-in `.sequelizerc`; migration and seeder directories match `coding-standards.md`
- [ ] `npm` scripts exist for migrate, rollback, and status
- [ ] **Roles** table: `id`, `globalUId`, `name` (unique), `description` (nullable), `entityStatus`, `createdAt`, `modifiedOn`
- [ ] **Permissions** table: `id`, `globalUId`, `name` (unique), `description` (nullable), `entityStatus`, `createdAt`, `modifiedOn`
- [ ] **Users** table: `id`, `globalUId`, `roleId` (FK → Roles, **nullable**), `email` (unique), `username` (unique), `firstName`, `lastName`, `passwordHash`, `entityStatus`, `createdAt`, `modifiedOn`
- [ ] **RolePermissions** table: `id`, `globalUId`, `roleId` (FK → Roles), `permissionId` (FK → Permissions), `entityStatus`, `createdAt`, `modifiedOn`
- [ ] **UNIQUE (`roleId`, `permissionId`)** on RolePermissions (FR-RP4)
- [ ] Every foreign key is **`ON DELETE RESTRICT`** (D-5 — nothing is ever deleted)
- [ ] Column types match the brief: BIGINT ids, UUID `globalUId`, VARCHAR lengths as specified, TIMESTAMPTZ timestamps, ENUM `entityStatus`
- [ ] Every migration runs `up` cleanly against a fresh database
- [ ] Every migration runs `down` cleanly, leaving no orphaned type or constraint (NFR-7)
- [ ] `synchronize` remains `false`; the schema comes only from migrations
- [ ] Indexes on the foreign keys and on the unique lookup columns used by login (`email`, `username`)

## Technical Notes

`roleId` on Users is deliberately nullable — FR-AC4 requires that a user with no role has no
permissions, which presumes such a user can exist.

`entityStatus` on RolePermissions is intentional: FR-AC3 requires a deactivated *link* to drop
out of permission resolution, independently of the role or permission it joins.

Order matters: Roles and Permissions before Users and RolePermissions, since those hold the FKs.

Verify `down` on a database that has rows, not just an empty one — a `down` that only works on
an empty schema is not a working `down`.

## Dependencies

- project-scaffold
