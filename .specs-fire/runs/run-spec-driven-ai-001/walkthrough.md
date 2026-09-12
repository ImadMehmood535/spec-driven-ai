---
run: run-spec-driven-ai-001
work_item: project-scaffold
intent: developer-user-module
generated: 2026-09-12T13:25:00Z
mode: confirm
---

# Implementation Walkthrough: Backend Project Scaffold

## Summary

The NestJS backend now exists as a working, tested frame — no domain entities, one health
route. `backend/` is a self-contained project: install, build, lint, test, and boot all work,
and every shared primitive the later work items depend on is in place and covered.

96 tests pass, coverage is 83.11%, lint is clean, and the app has been booted in a test to
prove Nest's DI graph, middleware chain, and routing actually work.

## Structure Overview

`backend/` and `frontend/` are two independent projects headed for two separate repositories.
This run created `backend/` only, with everything it needs to stand alone — its own
`package.json`, tsconfig, ESLint, Prettier, Jest, `.gitignore`, README, `.env.example`, and
`docker-compose.yml`. No root `package.json` and no workspaces, so the eventual split is a
directory move.

## Architecture

### Pattern Used

Layered DDD with CQRS vertical slices, following the read-only reference service. This run laid
the layers down empty; the entity slices fill them.

### Layer Structure

```text
backend/src/
├── api/                  HTTP boundary
│   ├── ApiModule.ts      controllers + APP_FILTER + middleware
│   ├── common/           ApiRoute, SwaggerTag const maps
│   ├── controllers/      AppController (health)
│   ├── filters/          DomainExceptionFilter — one place errors become status codes
│   ├── guards/           (empty — route-protection)
│   └── middleware/       RequestLoggerMiddleware, redacting
├── application/          use cases
│   ├── common/           PaginationMeta
│   └── modules/app/      AppService
├── domain/
│   ├── aggregates/       BaseModel (id, globalUId, createdAt, modifiedOn)
│   └── common/           TableNames: User, Role, Permission, RolePermission
├── infrastructure/
│   └── persistence/      DatabaseModule (synchronize: false), hooks/AuditHook
├── shared/               EntityStatus, 5 errors, Guards, Pagination, Redaction, AuditableFields
├── migrations/           (empty — database-migrations)
└── seeders/              (empty — seed-bootstrap)
```

## Files Changed

### Created

| File | Purpose |
|------|---------|
| `backend/package.json` | Nest 11, Sequelize, Swagger, CQRS deps; build/start/lint/test scripts |
| `backend/tsconfig.json` | `strictNullChecks`, decorators, five path aliases |
| `backend/tsconfig.build.json` | Excludes specs from the build |
| `backend/nest-cli.json` | Nest CLI config |
| `backend/eslint.config.mjs` | ESLint 9 flat config, `recommendedTypeChecked` + Prettier |
| `backend/.prettierrc` | `singleQuote`, `trailingComma: all` |
| `backend/jest.config.cjs` | `ts-jest`, alias mapping, coverage |
| `backend/.gitignore` | Self-contained, so the project survives the repo split |
| `backend/README.md` | Setup and commands |
| `backend/.env.example` | Every variable; secrets left empty |
| `backend/docker-compose.yml` | PostgreSQL 16 on host port 5440 |
| `backend/src/main.ts` | Bootstrap, Swagger at `/docs` |
| `backend/src/app.module.ts` | Config + Database + Api |
| `backend/src/shared/enums/EntityStatus.ts` | `ACTIVE` / `INACTIVE` |
| `backend/src/shared/errors/DomainError.ts` | → 400 |
| `backend/src/shared/errors/UnauthorizedError.ts` | → 401 |
| `backend/src/shared/errors/ForbiddenError.ts` | → 403 |
| `backend/src/shared/errors/NotFoundError.ts` | → 404 |
| `backend/src/shared/errors/ConflictError.ts` | → 409 |
| `backend/src/shared/domain/Guards.ts` | Five validation guards used by every aggregate |
| `backend/src/shared/utils/Pagination.ts` | Page/size resolution, defaults 1/50, max 100 |
| `backend/src/shared/utils/Redaction.ts` | Credential redaction before logging |
| `backend/src/shared/audit/AuditableFields.ts` | Audit field shape |
| `backend/src/application/common/PaginationMeta.ts` | Pagination response metadata |
| `backend/src/application/modules/app/AppService.ts` | Health payload |
| `backend/src/application/modules/app/AppApplicationModule.ts` | Health module |
| `backend/src/domain/aggregates/BaseModel.ts` | Shared Sequelize base columns |
| `backend/src/domain/common/TableNames.ts` | The four table names |
| `backend/src/infrastructure/persistence/DatabaseModule.ts` | Sequelize wiring, `synchronize: false` |
| `backend/src/infrastructure/persistence/hooks/AuditHook.ts` | Populates audit fields |
| `backend/src/api/ApiModule.ts` | Wires controllers, filter, middleware |
| `backend/src/api/common/ApiConstants.ts` | Route and Swagger tag maps |
| `backend/src/api/controllers/AppController.ts` | `GET /health` |
| `backend/src/api/filters/DomainExceptionFilter.ts` | Errors → 400/401/403/404/409 |
| `backend/src/api/middleware/RequestLoggerMiddleware.ts` | Request logging with redaction |
| 8 × `*.spec.ts` | 96 tests (listed in `test-report.md`) |
| 3 × `.gitkeep` | `api/guards/`, `migrations/`, `seeders/` |

### Modified

| File | Changes |
|------|---------|
| `.specs-fire/standards/constitution.md` | Added the absolute *Backend / Frontend Separation* rule |
| `.specs-fire/runs/run-spec-driven-ai-001/plan.md` | Layout section rewritten after the mid-run correction |

## Key Implementation Details

### 1. Credential redaction landed before any credential exists

The reference service logs whole request bodies. The moment `authentication-login` or
`user-crud` ships, that prints plaintext passwords to stdout. `Redaction.ts` walks the body,
replaces sensitive keys at any depth (case-insensitive, arrays included, cycle-safe), and never
mutates the input. An HTTP test POSTs a real password through the live middleware and asserts
the secret never reaches stdout while `[REDACTED]` does — NFR-3 proven end to end, not by
inspection.

### 2. One place errors become status codes

`DomainExceptionFilter` maps the five error types to 400/401/403/404/409 and is registered as a
global `APP_FILTER`. Handlers and controllers never touch HTTP status. The 401/403 split matters
for FR-AC7 — "not authenticated" and "not permitted" are different answers — so a test asserts
they stay distinct.

### 3. `synchronize: false` from the first commit

NFR-7 forbids Sequelize sync. The scaffold therefore boots against a database with no tables,
which is correct: `database-migrations` creates them. The line carries a comment so nobody
"fixes" it later.

### 4. Path aliases proven in three places

`tsc` resolves them via `paths`, `tsc-alias` rewrites them in `dist`, Jest maps them via
`moduleNameMapper`. All three must agree or later work items fail confusingly. Verified by
grepping `dist` for unresolved aliases and by `require`-ing the compiled `AppModule`.

### 5. The scaffold is booted, not just compiled

`AppController.spec.ts` creates a real Nest application from `ApiModule` and initialises it.
This caught a live risk: `forRoutes('*')` is known to throw under Express 5, which
`@nestjs/platform-express` 11 uses. It works on this version — but that is now a tested fact
rather than an assumption, and it would otherwise have surfaced on first startup.

## Security Considerations

| Concern | Approach |
|---------|----------|
| Credentials in logs (NFR-3) | `Redaction.ts` + an HTTP test asserting a POSTed password never reaches stdout |
| Secrets in source (NFR-8) | `.env.example` ships with empty values; `.env*` git-ignored in both root and `backend/` |
| Unauthenticated vs unauthorized | Separate `UnauthorizedError`/`ForbiddenError` → 401/403, tested as distinct |
| Schema drift on security tables | `synchronize: false`; schema only via migrations |
| Placeholder credentials in fixtures | Test data uses obvious placeholders, never realistic passwords |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repo layout | `backend/` and `frontend/` fully independent, no root tooling | User requirement: they become two separate repos |
| `EntityStatus` values | `ACTIVE`, `INACTIVE` only | `DRAFT` has no meaning for access control |
| Body redaction | Ship in the scaffold | The reference's wholesale body logging becomes a password leak once login exists |
| Jest config location | Separate `jest.config.cjs` | Keeps coverage config readable; the reference inlines it in `package.json` |
| DB host port | 5440 | Avoids colliding with other local Postgres instances |
| Test fake typing | Real interfaces, no `any` | `any` in the fakes tripped `no-unsafe-member-access`; typing them beat relaxing the rules |

## Deviations from Plan

Three, all mid-run corrections:

1. **Layout changed after the plan was approved.** The approved plan used npm workspaces
   (`apps/api`, `apps/web`). The user then clarified that backend and frontend become separate
   repos, so workspaces were dropped for two independent projects. `docker-compose.yml` moved
   from the root into `backend/`, and `backend/` gained its own `.gitignore` and `README.md`.
   The rule is now recorded in the constitution.
2. **Three more test files than planned.** The plan listed five; the run shipped eight, adding
   `AuditHook.spec.ts` (13 tests — audit fields are load-bearing for every table),
   `AppService.spec.ts`, and `AppController.spec.ts` (the HTTP boot test). Coverage went from
   61.03% to 83.11% as a result — the planned five left it below the 80% standard.
3. **`ApiRoute.App` removed during review.** It was dead: `AppController` uses a bare
   `@Controller()`.

## Dependencies Added

| Package | Why Needed |
|---------|------------|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | Framework |
| `@nestjs/config` | Environment configuration |
| `@nestjs/cqrs` | CommandBus/QueryBus for the entity slices |
| `@nestjs/sequelize`, `sequelize`, `sequelize-typescript` | ORM wiring |
| `@nestjs/swagger` | API documentation at `/docs` |
| `pg`, `pg-hstore` | PostgreSQL driver |
| `reflect-metadata`, `rxjs` | Nest runtime requirements |
| `jest`, `ts-jest`, `@nestjs/testing`, `supertest` | Test stack |
| `eslint`, `typescript-eslint`, `prettier` + plugins | Lint and format |
| `typescript`, `ts-node`, `tsc-alias`, `tsconfig-paths` | Build and alias resolution |

`@nestjs/jwt`, `bcrypt`, and `sequelize-cli` are **not** installed yet — they belong to the work
items that use them.

## How to Verify

1. **Install and test**
   ```bash
   cd backend && npm install && npm test
   ```
   Expected: 8 suites, 96 tests passing.

2. **Coverage**
   ```bash
   cd backend && npm run test:cov
   ```
   Expected: 83.11% statements; every logic file at 100%.

3. **Lint and build**
   ```bash
   cd backend && npm run lint && npm run build
   ```
   Expected: no errors; `dist/` produced with no unresolved path aliases.

4. **Boot against the database** (needs Docker running — not verified in this run)
   ```bash
   cd backend && cp .env.example .env && docker compose up -d && npm run start:dev
   ```
   Expected: API on `http://localhost:3000`, `GET /health` returns
   `{"service":"developer-user-module-api","status":"ok"}`, Swagger at `/docs`.

## Test Coverage

- Tests added: 96 across 8 suites
- Coverage: 83.11% statements, 89.88% branches
- Status: passing

## Ready for Review

- [x] All acceptance criteria met
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated (`backend/README.md`, constitution)
- [x] Developer notes captured

## Developer Notes

**Two things unverified**, both because the Docker daemon was not running: the live PostgreSQL
connection and Swagger rendering at `/docs`. Neither affects the code — `DatabaseModule` and
`main.ts` are the only uncovered files, and they are exactly what a real boot exercises. Start
Docker and run step 4 above to close them.

**`esModuleInterop` is absent** from the tsconfig, inherited from the reference service. CommonJS
packages therefore need `import * as x from 'x'`. It cost one failed test run here; worth
knowing before it bites in a later work item.

**Next work item**: `database-migrations` (high, validate) — two checkpoints, and it needs
Docker running to verify `up` and `down` against a real database.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-001*
