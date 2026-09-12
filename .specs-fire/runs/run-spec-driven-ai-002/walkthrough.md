---
run: run-spec-driven-ai-002
work_item: database-migrations
intent: developer-user-module
generated: 2026-09-12T16:25:00Z
mode: validate
---

# Implementation Walkthrough: Schema Migrations for the Four Tables

## Summary

The database now has its schema, created by versioned migrations rather than Sequelize sync.
Users, Roles, Permissions, and RolePermissions exist with the exact columns, constraints, and
indexes the brief decided — verified against a running PostgreSQL 16 instance, including a
rollback with foreign-key-referenced rows present.

118 tests pass, lint clean, build reproducible. The app boots with all four models registered
and provably does not touch the schema.

## Structure Overview

```text
backend/
├── .sequelizerc                      CLI → config, migrations, seeders
├── src/config/database.cjs           one connection config, read by CLI and app
├── src/migrations/
│   ├── 20260912160500-create-role.cjs
│   ├── 20260912160600-create-permission.cjs
│   ├── 20260912160700-create-user.cjs
│   └── 20260912160800-create-role-permission.cjs
└── src/domain/aggregates/
    ├── RoleAggregate/RoleModel.ts
    ├── PermissionAggregate/PermissionModel.ts
    ├── UserAggregate/UserModel.ts
    ├── RolePermissionAggregate/RolePermissionModel.ts
    └── SchemaContract.spec.ts        pins models to the migrations
```

## Key Implementation Details

### 1. One work item, four tables — because the constraints only make sense together

`users.roleId` references `Role`, and `RolePermission` references both `Role` and `Permission`.
Splitting them would mean migrations that create a table now and its foreign key later, which
is more moving parts for no review benefit.

### 2. `down` is tested the way it will actually be used

A rollback that only works on an empty schema is not a working rollback — it fails exactly when
you need it, mid-incident. So the verification seeded a role referenced by both a user and a
role-permission link, then rolled all four migrations back. Clean.

### 3. The enum-leak trap

PostgreSQL keeps a `CREATE TYPE` after its table is dropped, so a naive `down` leaves
`enum_User_entityStatus` behind and the next `up` fails with "type already exists". Each `down`
drops its type explicitly, and up → down → up is part of the evidence: 0 types remained, second
`up` applied all four.

### 4. Explicit constraint and index names

Sequelize infers names inconsistently between `addConstraint` and column shorthand, and a
`down` that cannot find what `up` created is the classic broken rollback. Every constraint and
index is named in the migration, and `down` removes them by name.

### 5. `ON DELETE RESTRICT` is verified behaviourally, not just declared

`pg_constraint.confdeltype = 'r'` on all three FKs, and a `DELETE` of a referenced role was
rejected with `violates foreign key constraint "User_roleId_fkey"`. With D-5 forbidding
deletion, a cascade would be dead code that silently destroys access records if ever reached.

### 6. `synchronize: false` proven, not assumed

The app was booted with all four models registered, and the `User` table's column count stayed
at 11. That is the assertion that matters: Sequelize saw the models and did not alter the
schema.

## Security Considerations

| Concern | Approach |
|---------|----------|
| A user with no credential | `passwordHash` is `NOT NULL` — there is no state that could read as "any password accepted" |
| Status trusted only in application code | `entityStatus` is a native enum, so the database rejects an invalid value; FR-AC3 keys authorization off it |
| Accidental destruction of access records | `ON DELETE RESTRICT` on every FK, verified behaviourally |
| Duplicate identities or grants under a race | Uniqueness enforced by the database: email, username, role name, permission name, and the (roleId, permissionId) pair |
| Schema drift on security tables | Migrations are the only source of schema; `synchronize: false` confirmed at runtime |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration language | CommonJS `.cjs` | The CLI runs them with node; TS would add a compile step per invocation |
| Config location | `src/config/database.cjs`, shared | A second copy of connection settings would drift |
| Enum storage | Native PostgreSQL ENUM per table | Database rejects invalid status rather than trusting the app |
| Timestamps | `TIMESTAMPTZ` | Access records are audited across environments; naive timestamps invite timezone bugs |
| Drift protection | `SchemaContract.spec.ts` | Migrations are untyped `.cjs`, so something must pin the models to them |

## Deviations from Plan

**One addition:** `dotenv` as a runtime dependency. `src/config/database.cjs` is loaded by the
CLI outside Nest, so it has no `ConfigModule` to read `.env` through. Not in the plan because
the need only appeared when the CLI first ran.

**One fix carried in:** `prebuild: rimraf dist *.tsbuildinfo`. A stale build cache made
`nest build` emit nothing while exiting 0 — the reason run 001 could not verify its boot. Fixed
here because reliable builds are a precondition for verifying migrations.

## Dependencies Added

| Package | Why Needed |
|---------|------------|
| `sequelize-cli` | Migration and seeder tooling |
| `dotenv` | The CLI reads `.env` outside Nest's `ConfigModule` |
| `rimraf` | `prebuild` clean, so a stale cache cannot produce an empty `dist` |

## How to Verify

1. **Apply from empty**
   ```bash
   cd backend && docker compose up -d && npm run migrate
   ```
   Expected: 4 migrations applied; `\dt` shows Role, Permission, User, RolePermission.

2. **Inspect the schema**
   ```bash
   docker exec developer-user-db psql -U postgres -d developer_user -c "\d \"User\""
   ```
   Expected: nullable `roleId`, NOT NULL `passwordHash`, TIMESTAMPTZ timestamps.

3. **Roll back and reapply**
   ```bash
   cd backend && npm run migrate:undo:all && npm run migrate
   ```
   Expected: both succeed; no "type already exists" on the second `up`.

4. **Tests**
   ```bash
   cd backend && npm test
   ```
   Expected: 9 suites, 118 tests.

## Test Coverage

- Tests added: 22 (schema contract), 118 total
- Live schema checks: 9, against PostgreSQL 16
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 13/13
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated (design doc, plan, this walkthrough)
- [x] Developer notes captured

## Developer Notes

**Migrations are not type-checked or linted.** They are `.cjs` outside the TS build, by design.
`SchemaContract.spec.ts` is what catches drift between them and the models — if you change a
column in a migration, that test is where the mismatch should surface. Keep it current.

**The composite unique index is declared in two places** — the migration and
`RolePermissionModel`'s `indexes` option. Sequelize needs it on the model; the contract test
asserts it. They must be kept in step by hand.

**Next work item**: `permission-crud` (medium, confirm) — the first vertical slice, and the
proving ground for the aggregate/repository/queries pattern the other three entities will copy.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-002*
