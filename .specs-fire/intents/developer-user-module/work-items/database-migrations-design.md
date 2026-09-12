---
work_item: database-migrations
intent: developer-user-module
created: 2026-09-12T16:00:00Z
mode: validate
checkpoint_1: approved
---

# Design: Schema Migrations for the Four Tables

## Summary

Introduce `sequelize-cli` migration tooling and create the schema for Users, Roles,
Permissions, and RolePermissions in one work item — the foreign keys and unique constraints
only make sense together. Columns follow the brief's decided *Data Model* exactly.

## Scope

**In Scope:**
- `sequelize-cli` wiring: `.sequelizerc`, a config the CLI and the app both read, npm scripts
- Four migrations creating the tables, with FKs, uniques, indexes, and the `entityStatus` enum
- Sequelize model classes for the four tables, registered with `DatabaseModule`
- Verified `up` and `down` against a real PostgreSQL instance, including with rows present

**Out of Scope:**
- Domain aggregates, repositories, queries, routes — the per-entity slices own those
- Seeds (`seed-bootstrap`)
- Any table beyond the four in `docs/scope.md` §4

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration tool | `sequelize-cli` with `.sequelizerc` | Recorded in `tech-stack.md`; the standard companion to Sequelize 6 |
| Migration language | Plain JS (CommonJS) in `src/migrations` | `sequelize-cli` runs migrations with node directly; TS would need a compile step on every invocation for no benefit |
| Config sharing | One `src/config/database.cjs` read by both the CLI and `DatabaseModule` | A second copy of the connection settings would drift |
| `entityStatus` storage | Native PostgreSQL `ENUM` per table | Matches the reference service's `DataType.ENUM`; the DB rejects an invalid status rather than trusting the app |
| Enum values | `ACTIVE`, `INACTIVE` | Mirrors `EntityStatus`; `DRAFT` was deliberately dropped in the scaffold |
| FK delete rule | `ON DELETE RESTRICT` everywhere | D-5: nothing is ever deleted, so a cascade would be dead code that silently destroys rows if reached |
| `users.roleId` | Nullable | FR-AC4 requires a user with no role to exist and resolve to no permissions |
| Composite uniqueness | `UNIQUE (roleId, permissionId)` on RolePermission | FR-RP4, and D-8 depends on the row surviving so removal can deactivate and re-assignment can reactivate |
| Timestamp type | `TIMESTAMPTZ` | Access-control records are audited across environments; a naive timestamp invites timezone bugs |
| `id` type | `BIGINT` | Matches `BaseModel` and the reference service |
| Table naming | PascalCase singular, from `TableNames` | Reference convention (`@Table({ tableName: TableNames.X })`) |

## Data Models Affected

### Creates

- **RoleModel**: `id`, `globalUId`, `name` (unique), `description`, `entityStatus`, `createdAt`, `modifiedOn` — roles available to users
- **PermissionModel**: `id`, `globalUId`, `name` (unique), `description`, `entityStatus`, `createdAt`, `modifiedOn` — the action catalogue
- **UserModel**: `id`, `globalUId`, `roleId` (FK, nullable), `email` (unique), `username` (unique), `firstName`, `lastName`, `passwordHash`, `entityStatus`, `createdAt`, `modifiedOn`
- **RolePermissionModel**: `id`, `globalUId`, `roleId` (FK), `permissionId` (FK), `entityStatus`, `createdAt`, `modifiedOn`, `UNIQUE(roleId, permissionId)`

## Technical Approach

### Architecture

```
src/config/database.cjs ──┬──> .sequelizerc ──> sequelize-cli ──> src/migrations/*.cjs
                          └──> DatabaseModule (NestJS runtime)

src/domain/aggregates/
  RoleAggregate/RoleModel.ts
  PermissionAggregate/PermissionModel.ts
  UserAggregate/UserModel.ts
  RolePermissionAggregate/RolePermissionModel.ts
        │
        └─> registered in DatabaseModule.models (synchronize stays false)
```

### Database Changes

```sql
-- order matters: Role and Permission first, then the tables holding their FKs
CREATE TYPE "enum_Role_entityStatus" AS ENUM ('ACTIVE','INACTIVE');
CREATE TABLE "Role" (
  id BIGSERIAL PRIMARY KEY,
  "globalUId" UUID NOT NULL,
  name VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(512),
  "entityStatus" "enum_Role_entityStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL,
  "modifiedOn" TIMESTAMPTZ
);
-- Permission: same shape
CREATE TABLE "User" (
  id BIGSERIAL PRIMARY KEY,
  "globalUId" UUID NOT NULL,
  "roleId" BIGINT REFERENCES "Role"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "entityStatus" "enum_User_entityStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL,
  "modifiedOn" TIMESTAMPTZ
);
CREATE TABLE "RolePermission" (
  id BIGSERIAL PRIMARY KEY,
  "globalUId" UUID NOT NULL,
  "roleId" BIGINT NOT NULL REFERENCES "Role"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "permissionId" BIGINT NOT NULL REFERENCES "Permission"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "entityStatus" "enum_RolePermission_entityStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL,
  "modifiedOn" TIMESTAMPTZ,
  CONSTRAINT "RolePermission_roleId_permissionId_unique" UNIQUE ("roleId","permissionId")
);
CREATE INDEX ON "User"("roleId");
CREATE INDEX ON "RolePermission"("roleId");
CREATE INDEX ON "RolePermission"("permissionId");
```

`email` and `username` need no extra index — their UNIQUE constraints create one, and login
looks up by exactly those columns.

## Dependencies

- `project-scaffold` (complete) — `BaseModel`, `TableNames`, `DatabaseModule`, `EntityStatus`
- `sequelize-cli` — new dev dependency

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `backend/.sequelizerc` | create | Points the CLI at config, migrations, seeders |
| `backend/src/config/database.cjs` | create | Single source of connection settings |
| `backend/src/migrations/*-create-role.cjs` | create | Role table |
| `backend/src/migrations/*-create-permission.cjs` | create | Permission table |
| `backend/src/migrations/*-create-user.cjs` | create | User table + FK + index |
| `backend/src/migrations/*-create-role-permission.cjs` | create | Join table + composite unique + indexes |
| `backend/src/domain/aggregates/RoleAggregate/RoleModel.ts` | create | Sequelize model |
| `backend/src/domain/aggregates/PermissionAggregate/PermissionModel.ts` | create | Sequelize model |
| `backend/src/domain/aggregates/UserAggregate/UserModel.ts` | create | Sequelize model |
| `backend/src/domain/aggregates/RolePermissionAggregate/RolePermissionModel.ts` | create | Sequelize model |
| `backend/src/infrastructure/persistence/DatabaseModule.ts` | modify | Register the four models |
| `backend/package.json` | modify | `sequelize-cli` + migrate/rollback/status scripts |

## Security Considerations

- **`passwordHash` is `NOT NULL`**: a user cannot exist without a credential, so there is no
  "no password set" state that could be mistaken for "any password accepted"
- **Status enforced by the database**: an invalid `entityStatus` is rejected at the storage
  layer, not only by application guards — relevant because FR-AC3 keys authorization off it
- **No cascading deletes**: with `RESTRICT`, a bug that attempts to delete a role cannot
  silently remove users' access or orphan permission grants
- **Uniqueness enforced by the database**: duplicate email, username, role name, permission
  name, and role-permission pair are impossible regardless of application-level races

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `down` only tested on an empty schema, then fails in practice | A rollback wedges an environment mid-incident | Acceptance requires `down` verified **with rows present**, including a FK-referenced row |
| PostgreSQL enum types outlive their table on rollback | `up` after `down` fails with "type already exists" | Each `down` drops its enum type explicitly; verified by running up→down→up |
| Migration order wrong, FK target missing | `up` fails on a clean database | Filename timestamps force Role and Permission before User and RolePermission; verified from empty |
| `synchronize` re-enabled later, drifting from migrations | Two sources of schema truth | `synchronize: false` retained with a comment; the model registration in this run does not change it |
| Sequelize's inferred FK/index names differ from the migration's | `down` cannot find what `up` created | Constraints and indexes are named explicitly in the migrations |

## Implementation Checklist

- [ ] `sequelize-cli` installed; `.sequelizerc` and `src/config/database.cjs` created
- [ ] npm scripts: `migrate`, `migrate:undo`, `migrate:undo:all`, `migrate:status`
- [ ] Four migrations, correctly ordered, with explicit constraint and index names
- [ ] Four Sequelize models extending `BaseModel`, using `TableNames`, `timestamps: false`
- [ ] Models registered in `DatabaseModule`; `synchronize` still `false`
- [ ] `up` verified from an empty database — all four tables, FKs, uniques, indexes present
- [ ] `down` verified with rows present, including a referenced row
- [ ] up → down → up verified (catches lingering enum types)
- [ ] Schema asserted against the real database, not just assumed
- [ ] Tests pass, lint clean, build succeeds

---
*Generated by specs.md - fabriqa.ai FIRE Flow | Checkpoint 1 approved: 2026-09-12T16:00:00Z (self-served under the user's standing instruction to run the loop autonomously)*
