---
run: run-spec-driven-ai-001
work_item: project-scaffold
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-12T12:58:00Z
---

# Implementation Plan: Backend Project Scaffold

## Approach

Stand up the NestJS backend frame and the shared primitives every later work item builds on.
No domain entities, no routes beyond health — the frame, not the content.

### Repository layout — decided by the user

`backend/` and `frontend/` are **two independent projects destined for two separate
repositories**. They sit in one directory for now purely for convenience, and nothing may
depend on that.

```
backend/              # NestJS API — this work item
  package.json  tsconfig.json  eslint.config.mjs  .prettierrc  jest.config.cjs
  .gitignore  .env.example  README.md  docker-compose.yml
  src/api|application|domain|infrastructure|shared
frontend/             # Next.js admin UI — ui-scaffold, later; equally self-contained
```

Consequences, now recorded as an absolute rule in `constitution.md` →
*Backend / Frontend Separation*:

- **No root-level tooling.** No root `package.json`, no workspaces, no shared lockfile, no
  root script spanning both. Commands run inside each project (`cd backend && npm test`).
- **Each project owns everything it needs** — config, ignores, README, env example. The
  backend owns `docker-compose.yml`, since the database is its concern.
- **No shared code, ever.** No shared types package, no cross-boundary import, no committed
  generated client. The contract between them is the HTTP API and its Swagger description.
- **Duplication across the boundary is correct.** FR-UI13's reuse rule applies within a
  project, not across the two.
- The test that matters: moving either directory into an empty repository must leave it
  working. This run's output satisfies that for `backend/`.

### Sequence

1. `backend/` project files — `docker-compose.yml`, `.gitignore`, `README.md`, `.env.example`
2. `backend/` tooling — TypeScript with path aliases, ESLint 9 flat config, Prettier, Jest
3. `shared/` primitives — enums, errors, guards, pagination, redaction
4. `domain/` foundations — `BaseModel`, `TableNames`
5. `api/` cross-cutting — exception filter, request logger, health controller
6. `infrastructure/persistence` — `DatabaseModule` with `synchronize: false`, audit hooks
7. Bootstrap — `main.ts` with Swagger at `/docs`, `app.module.ts`
8. Tests for every piece of logic the scaffold actually contains

## Files to Create

| File | Purpose |
|------|---------|
| `backend/docker-compose.yml` | PostgreSQL 16, healthcheck, named volume — owned by the backend |
| `backend/.gitignore` | Self-contained ignores so the project survives the repo split |
| `backend/README.md` | Backend setup instructions |
| `backend/.env.example` | Every backend variable, no real secret (NFR-8) |
| `backend/package.json` | Nest 11, Sequelize, Swagger deps; build/start/lint/test scripts |
| `backend/tsconfig.json` | `strictNullChecks`, decorators, the five path aliases |
| `backend/tsconfig.build.json` | Excludes tests from the build |
| `backend/nest-cli.json` | Nest CLI config, `deleteOutDir` |
| `backend/eslint.config.mjs` | ESLint 9 flat config, `recommendedTypeChecked` + Prettier |
| `backend/.prettierrc` | `singleQuote: true`, `trailingComma: all` |
| `backend/jest.config.cjs` | `ts-jest`, alias `moduleNameMapper`, coverage config |
| `backend/src/main.ts` | Bootstrap, Swagger at `/docs`, port from config |
| `backend/src/app.module.ts` | Root module wiring Config, Database, Api |
| `backend/src/shared/enums/EntityStatus.ts` | `ACTIVE` / `INACTIVE` only |
| `backend/src/shared/errors/DomainError.ts` | 400 — invalid input, broken invariant |
| `backend/src/shared/errors/UnauthorizedError.ts` | 401 — no valid token, bad credentials |
| `backend/src/shared/errors/ForbiddenError.ts` | 403 — valid identity, missing permission |
| `backend/src/shared/errors/NotFoundError.ts` | 404 — entity missing |
| `backend/src/shared/errors/ConflictError.ts` | 409 — duplicate or blocked operation |
| `backend/src/shared/domain/Guards.ts` | `requiredId`, `optionalId`, `requiredText`, `optionalText`, `ensureEntityStatus` |
| `backend/src/shared/utils/Pagination.ts` | `resolvePage`/`resolvePageSize`, defaults 1/50, max 100 |
| `backend/src/shared/utils/Redaction.ts` | Redacts credential fields before logging (NFR-3) |
| `backend/src/shared/audit/AuditableFields.ts` | `globalUId`, `createdAt`, `modifiedOn` shape |
| `backend/src/application/common/PaginationMeta.ts` | `PaginationMeta.of(page, size, total)` |
| `backend/src/application/modules/app/AppApplicationModule.ts` | Health use case module |
| `backend/src/application/modules/app/AppService.ts` | Returns service name and status |
| `backend/src/domain/aggregates/BaseModel.ts` | `id`, `globalUId`, `createdAt`, `modifiedOn` |
| `backend/src/domain/common/TableNames.ts` | `User`, `Role`, `Permission`, `RolePermission` |
| `backend/src/infrastructure/persistence/DatabaseModule.ts` | Sequelize wiring, **`synchronize: false`**, registers audit hooks |
| `backend/src/infrastructure/persistence/hooks/AuditHook.ts` | Populates `globalUId`/`createdAt`/`modifiedOn` |
| `backend/src/api/ApiModule.ts` | Controllers, `APP_FILTER`, middleware wiring |
| `backend/src/api/common/ApiConstants.ts` | `ApiRoute` + `SwaggerTag` const maps |
| `backend/src/api/controllers/AppController.ts` | Health endpoint |
| `backend/src/api/filters/DomainExceptionFilter.ts` | Maps the five domain errors to status codes (NFR-5) |
| `backend/src/api/middleware/RequestLoggerMiddleware.ts` | Request logging **with body redaction** (NFR-3) |
| `backend/src/migrations/.gitkeep` | Directory exists; tooling lands in `database-migrations` |
| `backend/src/seeders/.gitkeep` | Directory exists; seeds land in `seed-bootstrap` |
| `backend/src/api/guards/.gitkeep` | Directory exists; guards land in `route-protection` |

## Files to Modify

| File | Changes |
|------|---------|
| `.gitignore` | Root ignores kept minimal; each project carries its own |
| `.specs-fire/standards/coding-standards.md` | Structure block shows the `backend/` prefix |
| `.specs-fire/standards/testing-standards.md` | Run commands are per-project, not root-level |

## Tests

The scaffold contains real logic in five places, and each gets tests. Everything else is
configuration, covered by the app booting.

| Test File | Coverage |
|-----------|----------|
| `backend/src/shared/domain/Guards.spec.ts` | Each guard: valid input, blank, over-length, bad id, invalid status — the trim-and-null behaviour of `optionalText` included |
| `backend/src/shared/utils/Pagination.spec.ts` | Defaults, non-numeric, zero, negative, over-max clamping |
| `backend/src/shared/utils/Redaction.spec.ts` | Password redacted, token redacted, nested objects, non-credential fields untouched, absent body |
| `backend/src/application/common/PaginationMeta.spec.ts` | `totalPages` arithmetic including zero size and exact multiples |
| `backend/src/api/filters/DomainExceptionFilter.spec.ts` | All five error types → 400/401/403/404/409, and response body shape |

## Technical Details

**`EntityStatus` carries only `ACTIVE` and `INACTIVE`.** The reference service also has `DRAFT`,
which has no meaning for access control — including it would invite a third state nothing in
the brief defines.

**Redaction is a deliberate deviation from the reference.** That service logs whole request
bodies; once `authentication-login` and `user-crud` exist, that would print plaintext
passwords to stdout. `Redaction.ts` lands here, before any credential route exists, so the
leak is never possible rather than fixed later. It redacts by field name (`password`,
`passwordHash`, `token`, `authorization`) at any nesting depth.

**`synchronize: false` from the first commit.** The reference relies on `synchronize: true`;
NFR-7 forbids it. The scaffold therefore boots against a database with no tables, which is
correct — `database-migrations` creates them next.

**Audit hooks with explicit migrations.** The reference's hooks assume `synchronize`. The
`beforeUpdate`/`beforeBulkUpdate` hooks must set `modifiedOn` without relying on Sequelize
having created the column, so the hook writes the field and the migration guarantees it exists.

**Path aliases resolve in three places** — `tsc` build (`paths`), runtime (`tsc-alias` after
build), and Jest (`moduleNameMapper`). All three must agree or later work items break in
confusing ways; the scaffold's tests passing is what proves it.

**No guards, no entities, no migrations tooling.** Those belong to `route-protection`,
the per-entity slices, and `database-migrations` respectively. This item creates the empty
directories so the structure is visible, and stops there.

## Acceptance Criteria Mapping

Every criterion on the work item maps to something above. Two are satisfied by existing state
rather than new work:

- *".env is git-ignored and no secret is committed"* — `.gitignore` already excludes `.env*`
  from the baseline commit; the plan adds `.env.example` only.
- *"Jest configured; npm test runs (even with no tests yet)"* — exceeded: five test files ship
  with the scaffold, since the builder must never skip tests.

---
*Plan approved at checkpoint. Execution follows.*
