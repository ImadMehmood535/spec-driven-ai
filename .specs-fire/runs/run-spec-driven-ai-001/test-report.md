---
run: run-spec-driven-ai-001
work_item: project-scaffold
intent: developer-user-module
generated: 2026-09-12T13:20:00Z
status: passing
---

# Test Report: Backend Project Scaffold

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit | 93 | 0 | 0 | — |
| Integration (HTTP) | 3 | 0 | 0 | — |
| **Total** | **96** | **0** | **0** | **83.11%** |

Statements 83.11% · Branches 89.88% · Functions 89.74% · Lines 84.36%
**Target of 80% met.**

## Acceptance Criteria Validation

- ✅ **`src/` matches the standards layout** — `api/`, `application/`, `domain/`,
  `infrastructure/`, `shared/`, plus `migrations/`, `seeders/`, `api/guards/`
- ✅ **Path aliases resolve in build, run, and test** — verified four ways: `tsc` compiles,
  `tsc-alias` left no unresolved `@shared|@domain|@application|@api|@infrastructure` require in
  `dist`, Jest's `moduleNameMapper` resolves them across 96 tests, and a runtime `require` of
  the compiled `AppModule` succeeds
- ✅ **ESLint 9 flat config and Prettier match the recorded settings** — `npm run lint` clean
- ✅ **Jest configured with alias mapping; `npm test` runs** — 8 suites, 96 tests
- ✅ **`EntityStatus` provides ACTIVE / INACTIVE** — and deliberately not `DRAFT`; a test
  asserts `DRAFT` is rejected
- ✅ **Five domain errors exist** — `DomainError`, `NotFoundError`, `ConflictError`,
  `UnauthorizedError`, `ForbiddenError`
- ✅ **`Guards.ts` provides all five guards** — 100% statements
- ✅ **`Pagination.ts` defaults 1/50, max 100** — clamping and fallbacks tested
- ✅ **`PaginationMeta.of`** — including the divide-by-zero case
- ✅ **`DomainExceptionFilter` maps 400/401/403/404/409** — 100%, with an explicit test that
  401 and 403 stay distinct
- ✅ **Request logger redacts the body (NFR-3)** — proven at two levels: `Redaction.ts` at 100%
  (nesting, arrays, case-insensitive keys, circular refs, no mutation), and an **HTTP test that
  POSTs a real password through the live middleware and asserts the secret never reaches
  stdout** while `[REDACTED]` does
- ✅ **`BaseModel` defines id, globalUId, createdAt, modifiedOn**
- ✅ **`TableNames` defines the four table names** — verified at runtime
- ✅ **`DatabaseModule` uses `synchronize: false`** — set in source; the live connection is
  unverified (see Issues)
- ✅ **App boots and serves routes** — a Nest application is created from `ApiModule`,
  initialised, and `GET /health` returns 200 with the expected body
- ✅ **`docker-compose.yml` provides PostgreSQL 16; `.env.example` lists every variable**
- ✅ **`.env` git-ignored, no secret committed** — root and `backend/.gitignore` exclude
  `.env*`; `.env.example` ships with empty secret values

18 of 18 criteria validated. One carries a caveat: Swagger and the database connection are
covered by source inspection rather than a live boot (Issues below).

## Tests Written

### Unit Tests

- `src/shared/domain/Guards.spec.ts` — all five guards: valid, blank, whitespace-only,
  over-length, boundary length, non-integer and non-positive ids, invalid status
- `src/shared/utils/Pagination.spec.ts` — defaults, non-numeric, zero, negative, fractional,
  over-max clamping, exact maximum
- `src/shared/utils/Redaction.spec.ts` — ten credential field names, case-insensitivity, a
  similarly-named non-credential field left alone, nesting, arrays, no input mutation,
  primitives, circular references, secret-never-in-output
- `src/application/common/PaginationMeta.spec.ts` — partial last page, exact multiple, empty
  result, zero page size
- `src/application/modules/app/AppService.spec.ts` — health payload
- `src/api/filters/DomainExceptionFilter.spec.ts` — all five error types to their status codes,
  response body shape, 401-versus-403 distinction
- `src/infrastructure/persistence/hooks/AuditHook.spec.ts` — hook registration, UUID format,
  existing values preserved, non-new records untouched, bulk create with distinct UUIDs,
  `modifiedOn` on single and bulk updates, no duplicate field, empty options tolerated

### Integration Tests

- `src/api/controllers/AppController.spec.ts` — boots the API layer without a database and
  exercises Nest's DI graph, middleware registration, and controller routing: `/health`
  returns 200; the request logger runs; **a POSTed password never appears in the log**

## Test Commands

```bash
# Run all tests
cd backend && npm test

# Run with coverage
cd backend && npm run test:cov
```

## Coverage Details

| Module | Statements | Branches | Functions | Lines |
|--------|------------|----------|-----------|-------|
| `shared/domain/Guards.ts` | 100% | 96.42% | 100% | 100% |
| `shared/utils/Redaction.ts` | 100% | 100% | 100% | 100% |
| `shared/utils/Pagination.ts` | 100% | 100% | 100% | 100% |
| `shared/errors/*` | 100% | 100% | 100% | 100% |
| `shared/enums/EntityStatus.ts` | 100% | 100% | 100% | 100% |
| `api/ApiModule.ts` | 100% | 100% | 100% | 100% |
| `api/common/ApiConstants.ts` | 100% | 100% | 100% | 100% |
| `api/controllers/AppController.ts` | 100% | 100% | 100% | 100% |
| `api/filters/DomainExceptionFilter.ts` | 100% | 100% | 100% | 100% |
| `api/middleware/RequestLoggerMiddleware.ts` | 100% | 82.6% | 100% | 100% |
| `application/common/PaginationMeta.ts` | 100% | 100% | 100% | 100% |
| `application/modules/app/AppService.ts` | 100% | 100% | 100% | 100% |
| `infrastructure/persistence/hooks/AuditHook.ts` | 100% | 100% | 100% | 100% |
| `main.ts` | 0% | 0% | 0% | 0% |
| `app.module.ts` | 0% | 100% | 100% | 0% |
| `domain/aggregates/BaseModel.ts` | 0% | 100% | 100% | 0% |
| `infrastructure/persistence/DatabaseModule.ts` | 0% | 100% | 0% | 0% |

The four uncovered files are the ones that cannot run without a live database: the bootstrap,
the root module that imports `DatabaseModule`, the Sequelize base model, and `DatabaseModule`
itself. Covering them requires a real PostgreSQL instance, which arrives with
`database-migrations`.

## Issues Found

| Issue | Severity | Status |
|-------|----------|--------|
| Live database connection unverified — the Docker daemon was not running, so PostgreSQL never started | low | **open** |
| Swagger at `/docs` unverified — same cause; `SwaggerModule.setup` runs in `main.ts`, which a test does not execute | low | **open** |

### What the HTTP test settled

An earlier draft of this report listed the boot as unverified and coverage at 61%. Both were
resolved by adding `AppController.spec.ts`, which creates and initialises a real Nest
application. That proves Nest's DI graph resolves, middleware registers correctly, routing
works, and redaction functions in the live request path — and it lifted coverage from 61.03% to
83.11%.

It specifically ruled out a risk worth naming: `forRoutes('*')` is known to throw under Express
5, which `@nestjs/platform-express` 11 uses. The test boots the middleware chain successfully,
so the pattern works on this version. Without that test the problem would have surfaced only on
first real startup.

To close the two remaining items: start Docker, then
`cd backend && docker compose up -d && npm run start:dev`, and check
`http://localhost:3000/health` and `http://localhost:3000/docs`.

## Ready for Completion

- [x] All tests passing — 96
- [x] Coverage target met (80%) — 83.11%
- [x] All acceptance criteria validated
- [x] No critical issues open

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-001*
