---
run: run-spec-driven-ai-002
work_item: database-migrations
intent: developer-user-module
mode: validate
checkpoint: plan
approved_at: 2026-09-12T16:02:00Z
---

# Implementation Plan: Schema Migrations for the Four Tables

> Checkpoints 1 (design) and 2 (plan) self-served under the user's standing instruction to run
> the loop autonomously. Design doc:
> `.specs-fire/intents/developer-user-module/work-items/database-migrations-design.md`

## Approach

Wire `sequelize-cli`, write four ordered migrations, add the four Sequelize models, register
them, then **prove** the schema against the running PostgreSQL container — `up` from empty,
`down` with rows present, and up→down→up to catch lingering enum types.

## Files to Create

| File | Purpose |
|------|---------|
| `backend/.sequelizerc` | Points the CLI at config, migrations, seeders |
| `backend/src/config/database.cjs` | Connection settings shared by the CLI and the app |
| `backend/src/migrations/20260912160500-create-role.cjs` | Role table + enum |
| `backend/src/migrations/20260912160600-create-permission.cjs` | Permission table + enum |
| `backend/src/migrations/20260912160700-create-user.cjs` | User table + FK + index |
| `backend/src/migrations/20260912160800-create-role-permission.cjs` | Join table + composite unique + indexes |
| `backend/src/domain/aggregates/RoleAggregate/RoleModel.ts` | Role model |
| `backend/src/domain/aggregates/PermissionAggregate/PermissionModel.ts` | Permission model |
| `backend/src/domain/aggregates/UserAggregate/UserModel.ts` | User model |
| `backend/src/domain/aggregates/RolePermissionAggregate/RolePermissionModel.ts` | Join model |
| `backend/src/domain/aggregates/SchemaContract.spec.ts` | Asserts model definitions match the migrations |

## Files to Modify

| File | Changes |
|------|---------|
| `backend/src/infrastructure/persistence/DatabaseModule.ts` | Register the four models; `synchronize` stays `false` |
| `backend/package.json` | `sequelize-cli` dev dep; migrate/rollback/status scripts; `prebuild` clean (carried in from the build fix below) |

## Tests

| Test File | Coverage |
|-----------|----------|
| `backend/src/domain/aggregates/SchemaContract.spec.ts` | Each model's table name comes from `TableNames`, `timestamps: false`, `passwordHash` not nullable, `roleId` nullable on User, enum values limited to ACTIVE/INACTIVE |

Schema correctness itself is verified against the live database by the migration run, recorded
in `test-report.md` with the actual `psql` output rather than asserted in a unit test.

## Technical Details

**Migrations are CommonJS `.cjs`.** `sequelize-cli` invokes them with node directly; TypeScript
would need a compile step per invocation for no benefit. They are data definitions, not
application logic, so they sit outside the TS build.

**Explicit constraint and index names.** Sequelize infers names inconsistently between
`addConstraint` and the column shorthand, and a `down` that cannot find what `up` created is
the classic broken rollback. Every constraint and index is named in the migration.

**Enum types are dropped in `down`.** PostgreSQL keeps a `CREATE TYPE` after its table is
dropped, so a second `up` fails with "type already exists". Each `down` drops its type, and
up→down→up is part of acceptance.

**Incidental fix carried in this run:** `prebuild: rimraf dist *.tsbuildinfo`. A stale
`.tsbuildinfo` made `nest build` emit nothing while exiting 0, leaving `dist/` absent — which
broke the boot verification for run 001. Found while closing that run's open item, fixed here
because reliable builds are a precondition for verifying migrations.

---
*Plan approved at checkpoint. Execution follows.*
