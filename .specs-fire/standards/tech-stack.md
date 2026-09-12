# Tech Stack

## Overview

Greenfield, **standalone** repository — it belongs to no other repo or estate. Backend follows
the architecture of the read-only reference service
`/Users/imadmehmood/projects/invespy/v2/invespy-v2-feeds-microservice` (NestJS, DDD + CQRS
vertical slices over Sequelize/PostgreSQL). Frontend is a Next.js admin UI for managing
users, roles, permissions, and role-permission assignments.

## Core Technologies

### Language

**Primary**: TypeScript
**Version**: 5.7.x (backend, matching reference service)

### Framework

**Framework**: NestJS (backend) / Next.js (admin UI)
**Version**: NestJS 11.x / Next.js 14.x
**Rationale**: NestJS 11 with `@nestjs/cqrs` is the pattern shown in the reference repo;
Next.js follows the shape of the existing Invespy web frontend (also read-only).

### Runtime

**Runtime**: Node.js
**Version**: 22.x (reference service pins `@types/node` ^22.10.7)

## Data Layer

### Database

**Type**: Relational
**Database**: PostgreSQL
**Version**: 16 (reference `docker-compose.yml` uses `postgres:16-alpine`)

### ORM / Data Access

**Tool**: Sequelize 6 via `sequelize-typescript` and `@nestjs/sequelize`
**Rationale**: Required by the user. Write side goes through repositories returning domain
aggregates; read side goes through separate query classes returning flat read models.

### Migrations

**Tool**: `sequelize-cli` with a checked-in `.sequelizerc` and migration directory
**Setting**: `synchronize: false` in every environment — the reference service's
`synchronize: true` is deliberately **not** followed
**Rationale**: The module stores credentials and access rules, so schema changes must be
reviewable, ordered, and reversible. Every migration has a working `up` and `down`, runs in CI,
and is applied before the app boots.

### Seeds

**Tool**: `sequelize-cli` seeders, kept separate from migrations and independently runnable
**Contents**: permission catalogue, default administrator role, first administrator user
**Rule**: idempotent — re-running creates no duplicates and does not reset existing credentials.
Seed administrator credentials come from environment variables, never from source.

### Caching

Not configured.

## API Layer

### API Style

**Style**: REST over HTTP, CQRS behind the controller (`CommandBus` / `QueryBus`)

### Documentation

**Tool**: Swagger via `@nestjs/swagger`, served at `/docs`

## Authentication

**Mechanism**: JWT, issued by this module on successful credential verification
**Library**: `@nestjs/jwt`
**Password hashing**: `bcrypt`, cost factor 12 — chosen for ubiquity in the NestJS ecosystem
and a stable native build story; `argon2id` is the alternative if the user prefers it
**Secret and lifetime**: environment configuration only (`JWT_SECRET`, `JWT_EXPIRES_IN`),
never committed
**Claims**: user `globalUId`, `username`, role name, and effective permission names
**Not included**: refresh tokens, token revocation, and password reset — `docs/scope.md`
defines none of them, so each is a scope change per §10

## Frontend (if applicable)

Specified by the user. Full conventions live in
`.specs-fire/standards/coding-standards.md` → *Frontend Standards*.

### UI Framework

**Framework**: Next.js (App Router) with **TypeScript**
**Version**: 14.x

### Component System

**Primary**: **shadcn/ui** — the single component system; no second library
**Primitives**: Radix (via shadcn/ui) when a component must be composed
**Icons**: **Lucide** — the only icon set
**Variants**: `class-variance-authority`

### Styling

**Approach**: **Tailwind CSS**, utility-first; no CSS-in-JS
**Theme**: CSS custom properties / Tailwind tokens — never hard-coded colours in components
**Dark mode**: `next-themes`, honouring system preference with an explicit toggle

### State Management

**Server state**: TanStack Query
**Forms**: React Hook Form with a Zod resolver
**Tables**: TanStack Table (server-side pagination against the API's `PaginationMeta`)
**Toasts**: the shadcn/ui toast (`sonner`)

### Design Direction

Modern 2026 SaaS/admin patterns; responsive across desktop, tablet, and mobile; accessible and
keyboard-friendly; reusable components over duplicated UI. Explicitly avoided: generic-looking
dashboards, excessive cards, gradients, decoration, and unnecessary animation.

## Infrastructure

### Hosting

**Platform**: Not yet decided — deferred until the module is built

### Containerization

**Tool**: Docker Compose for local PostgreSQL (mirroring the reference service)

### CI/CD

**Platform**: Not yet configured

## Development Tools

### Package Manager

**Manager**: npm

### Build Tool

**Tool**: `nest build` + `tsc-alias` (backend); `next build` (frontend)

### Linting

**Linter**: ESLint 9 flat config (`typescript-eslint` recommendedTypeChecked)
**Config**: `eslint.config.mjs`

### Formatting

**Formatter**: Prettier 3
**Config**: `.prettierrc` — `{ "singleQuote": true, "trailingComma": "all" }`

## Dependencies

### Production Dependencies

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` (^11) — framework
- `@nestjs/cqrs` (^11) — CommandBus / QueryBus
- `@nestjs/sequelize`, `sequelize`, `sequelize-typescript` — ORM wiring
- `@nestjs/config` — environment configuration
- `@nestjs/swagger` — API documentation
- `pg`, `pg-hstore` — PostgreSQL driver
- `reflect-metadata`, `rxjs` — NestJS runtime requirements
- `@nestjs/jwt` — JWT issuing and verification
- `bcrypt` — password hashing (cost 12)

**Admin UI:**
- `next`, `react`, `react-dom` — framework
- `tailwindcss`, `tailwind-merge`, `clsx`, `class-variance-authority` — styling and variants
- `@radix-ui/*` (via shadcn/ui) — accessible primitives
- `lucide-react` — icons
- `next-themes` — dark mode
- `@tanstack/react-query` — server state
- `@tanstack/react-table` — tables
- `react-hook-form`, `zod`, `@hookform/resolvers` — forms and validation
- `sonner` — toasts

### Development Dependencies

- `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing`
- `jest` (^30), `ts-jest`, `supertest` — test stack
- `eslint`, `typescript-eslint`, `prettier`, `eslint-plugin-prettier`, `eslint-config-prettier`
- `typescript`, `ts-node`, `tsc-alias`, `tsconfig-paths`, `@types/node`, `@types/jest`
- `sequelize-cli` — migrations and seeders
- `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jest-axe` — frontend tests
- `msw` — API mocking at the network boundary
- `@playwright/test` — end-to-end flows
- `@types/bcrypt` — hashing types

## Version Requirements

| Tool | Minimum Version | Recommended |
|------|-----------------|-------------|
| Node.js | 20.x | 22.x |
| npm | 10.x | 10.x |
| PostgreSQL | 16 | 16 |
| TypeScript | 5.7 | 5.7 |

---
*Generated by specs.md - fabriqa.ai FIRE Flow*
