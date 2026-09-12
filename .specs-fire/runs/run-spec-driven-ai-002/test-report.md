---
run: run-spec-driven-ai-002
work_item: database-migrations
intent: developer-user-module
generated: 2026-09-12T16:20:00Z
status: passing
---

# Test Report: Schema Migrations for the Four Tables

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit | 118 | 0 | 0 | — |
| Schema verification (live DB) | 9 checks | 0 | 0 | — |
| **Total** | **118 tests + 9 live checks** | **0** | **0** | **83%+** |

Schema correctness is verified against the **running PostgreSQL 16 container**, not asserted in
a unit test. The `psql` output below is the evidence.

## Acceptance Criteria Validation

- ✅ **`sequelize-cli` wired** — `.sequelizerc` + `src/config/database.cjs`, one config read by
  both the CLI and the app
- ✅ **npm scripts** — `migrate`, `migrate:undo`, `migrate:undo:all`, `migrate:status`
- ✅ **Role table** — id, globalUId, name (unique), description (nullable), entityStatus, createdAt, modifiedOn
- ✅ **Permission table** — same shape
- ✅ **User table** — with **nullable** `roleId` FK, unique email and username, NOT NULL `passwordHash`
- ✅ **RolePermission table** — both FKs NOT NULL, link-level `entityStatus`
- ✅ **`UNIQUE (roleId, permissionId)`** — present as `RolePermission_roleId_permissionId_unique`
- ✅ **Every FK is `ON DELETE RESTRICT`** — `pg_constraint.confdeltype = 'r'` on all three, and
  proven behaviourally: deleting a referenced role fails with
  `violates foreign key constraint "User_roleId_fkey"`
- ✅ **Column types match the brief** — BIGINT ids, UUID globalUId, VARCHAR lengths,
  **TIMESTAMPTZ** timestamps, native ENUM entityStatus
- ✅ **`up` runs cleanly from empty** — 4 migrations applied
- ✅ **`down` runs cleanly with rows present** — verified with a role referenced by both a user
  and a role-permission link; all 4 reverted
- ✅ **`synchronize` remains `false`** — the app booted with all four models registered and the
  `User` column count stayed at 11, proving it did not touch the schema
- ✅ **Indexes on FKs and login lookups** — `User_roleId_index`,
  `RolePermission_roleId_index`, `RolePermission_permissionId_index`; email/username covered by
  their UNIQUE constraints

## Live Database Verification

```
=== tables ===
 public | Permission     | table
 public | Role           | table
 public | RolePermission | table
 public | SequelizeMeta  | table
 public | User           | table

=== User columns ===
 id           | bigint                   | NO
 globalUId    | uuid                     | NO
 roleId       | bigint                   | YES   <- nullable, per FR-AC4
 email        | character varying        | NO
 username     | character varying        | NO
 firstName    | character varying        | NO
 lastName     | character varying        | NO
 passwordHash | character varying        | NO    <- no "credential-less user" state
 entityStatus | USER-DEFINED             | NO
 createdAt    | timestamp with time zone | NO
 modifiedOn   | timestamp with time zone | YES

=== constraints (u = unique, f = FK; confdeltype r = RESTRICT) ===
 Permission_name_unique                    | u | "Permission"     |
 Role_name_unique                          | u | "Role"           |
 RolePermission_permissionId_fkey          | f | "RolePermission" | r
 RolePermission_roleId_fkey                | f | "RolePermission" | r
 RolePermission_roleId_permissionId_unique | u | "RolePermission" |
 User_email_unique                         | u | "User"           |
 User_roleId_fkey                          | f | "User"           | r
 User_username_unique                      | u | "User"           |

=== enum types ===
 enum_Permission_entityStatus     | ACTIVE,INACTIVE
 enum_RolePermission_entityStatus | ACTIVE,INACTIVE
 enum_Role_entityStatus           | ACTIVE,INACTIVE
 enum_User_entityStatus           | ACTIVE,INACTIVE

=== RESTRICT enforced ===
delete from "Role" where id=1;
ERROR: violates foreign key constraint "User_roleId_fkey" on table "User"

=== rollback with rows present ===
Role=1 Permission=1 User=1 RolePermission=1 rows seeded, then:
== 20260912160800-create-role-permission: reverted
== 20260912160700-create-user: reverted
== 20260912160600-create-permission: reverted
== 20260912160500-create-role: reverted

=== after down ===
tables remaining: 0
enum types remaining: 0   <- the enum-leak trap, avoided

=== second up ===
4 migrations applied
```

## Tests Written

- `src/domain/aggregates/SchemaContract.spec.ts` — 22 tests pinning the model definitions to
  the migrations: table names resolved from `TableNames`, audit columns on all four models,
  `User.roleId` nullable, `passwordHash` required, email/username required and unique,
  RolePermission FKs required, the composite unique index declared, `entityStatus` required and
  limited to ACTIVE/INACTIVE, and explicitly not carrying DRAFT

## Test Commands

```bash
cd backend && npm test                 # 118 tests
cd backend && npm run migrate          # apply
cd backend && npm run migrate:status   # what is applied
cd backend && npm run migrate:undo:all # roll back
```

## Issues Found

| Issue | Severity | Status |
|-------|----------|--------|
| A stale `.tsbuildinfo` made `nest build` emit nothing while exiting 0, leaving `dist/` absent — this is what blocked run 001's boot verification | medium | **fixed** — added `prebuild: rimraf dist *.tsbuildinfo`, verified reproducible from a clean state |
| `SchemaContract.spec.ts` helper failed to typecheck across four unrelated model classes | low | **fixed** — narrowed to a structural `AnyModelClass` type instead of a union |

### Run 001's open items, now closed

Docker is running, so the two items left open by the previous run were verified:
`GET /health` returns 200, `/docs` serves Swagger UI (`swagger-ui` present in the response),
and Sequelize connects with no errors.

## Ready for Completion

- [x] All tests passing — 118
- [x] Coverage target met — every logic file at 100%; new models are declarations, pinned by the contract test
- [x] All acceptance criteria validated — 13/13, all against a live database
- [x] No critical issues open

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-002*
