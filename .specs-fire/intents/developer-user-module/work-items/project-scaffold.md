---
id: project-scaffold
title: Backend Project Scaffold
intent: developer-user-module
complexity: medium
mode: validate
status: pending
depends_on: []
created: 2026-09-12T12:38:02Z
---

# Work Item: Backend Project Scaffold

## Description

Stand up the NestJS backend skeleton with the layer structure, tooling, and shared primitives
every later work item builds on. No domain entities yet — this is the frame, not the content.

Covers the `shared/` layer (errors, guards, enums, pagination), the `api/` cross-cutting
pieces (exception filter, request logger with credential redaction), `BaseModel`, `TableNames`,
Swagger bootstrap, and local PostgreSQL via Docker Compose.

## Acceptance Criteria

- [ ] `src/` matches the layout in `coding-standards.md` → *File Organization*: `api/`, `application/`, `domain/`, `infrastructure/`, `shared/`, plus `migrations/` and `seeders/`
- [ ] Path aliases `@api/* @application/* @domain/* @infrastructure/* @shared/*` resolve in build, run, and test
- [ ] ESLint 9 flat config and Prettier match the recorded settings; `npm run lint` and `npm run format` work
- [ ] Jest configured with the alias `moduleNameMapper`; `npm test` runs (even with no tests yet)
- [ ] `shared/enums/EntityStatus.ts` provides `ACTIVE` / `INACTIVE`
- [ ] `shared/errors/` provides `DomainError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`
- [ ] `shared/domain/Guards.ts` provides `requiredId`, `optionalId`, `requiredText`, `optionalText`, `ensureEntityStatus`
- [ ] `shared/utils/Pagination.ts` provides `resolvePage`/`resolvePageSize` with defaults 1/50 and max 100 (NFR-4)
- [ ] `application/common/PaginationMeta.ts` provides `PaginationMeta.of(page, size, total)`
- [ ] `DomainExceptionFilter` maps DomainError→400, UnauthorizedError→401, ForbiddenError→403, NotFoundError→404, ConflictError→409 (NFR-5)
- [ ] `RequestLoggerMiddleware` logs method, path, status, duration — and **redacts the request body** on credential-bearing routes (NFR-3)
- [ ] `domain/aggregates/BaseModel.ts` defines `id`, `globalUId`, `createdAt`, `modifiedOn`
- [ ] `domain/common/TableNames.ts` defines the four table names as a const map
- [ ] `DatabaseModule` connects to PostgreSQL with **`synchronize: false`** (NFR-7) and registers audit hooks populating `globalUId`/`createdAt`/`modifiedOn`
- [ ] Swagger served at `/docs`; app boots on the configured port
- [ ] `docker-compose.yml` provides PostgreSQL 16; `.env.example` lists every variable with no real secret (NFR-8)
- [ ] `.env` is git-ignored and no secret is committed

## Technical Notes

Follow the reference repo's layout and conventions — read-only, never written to. `EntityStatus`
carries only `ACTIVE` and `INACTIVE`; the reference's `DRAFT` has no meaning for access control.

Audit hooks come from the reference's `AuditHook.ts` pattern, but the `beforeUpdate` hook must
work with `synchronize: false` and explicit migrations.

Body redaction is a deviation from the reference, which logs bodies wholesale — a leak risk
once login exists. Redact by route or by field name before the first credential route lands.

## Dependencies

(none)
