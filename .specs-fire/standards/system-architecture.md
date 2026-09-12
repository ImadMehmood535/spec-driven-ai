# System Architecture

## Overview

The Developer User Module is a NestJS service providing Role-Based Access Control for the
Developer platform, plus a Next.js admin UI for managing it. It owns four entities — Users,
Roles, Permissions, Role Permissions — and answers one question for the rest of the platform:
*may this user perform this action?*

The backend follows the DDD + CQRS vertical-slice architecture of
`/Users/imadmehmood/projects/invespy/v2/invespy-v2-feeds-microservice`.

## System Context

Per `docs/scope.md` §8, this module is responsible for access control only. It holds no
project, inventory, CRM, lead, sales, or financial logic; those belong to their own modules.
Other Developer-platform modules consume this module's permission-check capability.

### Context Diagram

```
┌──────────────────┐        ┌─────────────────────────────┐
│  Admin UI        │  HTTP  │  Developer User Module       │
│  (Next.js)       │───────>│  (NestJS)                    │
└──────────────────┘        │                              │
                            │  Users · Roles · Permissions │
┌──────────────────┐        │  RolePermissions             │
│  Other Developer │  HTTP  │                              │
│  platform modules│───────>│  permission check            │
└──────────────────┘        └──────────────┬───────────────┘
                                           │ Sequelize
                                           ▼
                                  ┌──────────────────┐
                                  │  PostgreSQL 16   │
                                  └──────────────────┘
```

### Users

- **Developer platform administrator**: creates and manages users, roles, permissions, and
  role-permission assignments through the admin UI
- **Developer platform user**: subject of access control; authenticates and receives
  permissions through the single role assigned to them

### External Systems

- **PostgreSQL 16**: the module's own database, holding all four tables
- **Other Developer platform modules**: callers of the permission-check capability
There are no other external systems. This is a **standalone project**: it integrates with no
other repository or service, shares no database, and links to no other `User` table.

**No external identity provider.** This module owns identity, credentials, roles, and
permissions outright, in its own PostgreSQL tables. No third-party identity provider or
identity service is used, now or later. The `invespy-v2-feeds-microservice` repository is a
**read-only reference for DDD, CQRS, and clean-architecture layout only** — it is never written
to, and no other repository informs this module's design. See the constitution's
*Repository Boundary*.

## Architecture Pattern

**Pattern**: Layered DDD with CQRS vertical slices
**Rationale**: Mandated by the user, and identical to every Invespy v2 service. Commands go
through repositories that return domain aggregates enforcing their own invariants; queries go
through separate query classes returning flat read models, bypassing aggregate rehydration.

## Component Architecture

### Components

#### api

- **Purpose**: HTTP boundary
- **Responsibilities**: controllers that translate a request into a command or query and
  dispatch it on `CommandBus`/`QueryBus`; `DomainExceptionFilter` mapping domain errors to
  status codes; request-logging middleware
- **Dependencies**: application

#### application

- **Purpose**: use cases, one folder per feature
- **Responsibilities**: `Command`/`Query` objects, their handlers, and the `Request`/`Response`
  classes that carry Swagger metadata. Handlers depend only on ports.
- **Dependencies**: domain, infrastructure ports (`abstraction/`)

#### domain

- **Purpose**: the access-control model itself
- **Responsibilities**: `User`, `Role`, `Permission`, `RolePermission` aggregates with private
  constructors and guard-backed mutation; the `sequelize-typescript` models; `TableNames`
- **Dependencies**: shared

#### infrastructure

- **Purpose**: persistence
- **Responsibilities**: repositories (write side, aggregate in/out), query classes (read side,
  read models out), per-aggregate persistence modules binding `Symbol` tokens, `DatabaseModule`,
  audit hooks populating `globalUId`/`createdAt`/`modifiedOn`
- **Dependencies**: domain, shared

#### shared

- **Purpose**: cross-cutting primitives
- **Responsibilities**: `EntityStatus` enum, `AuditableFields`, `DomainError`/`NotFoundError`/
  `ConflictError`, `Guards`, pagination helpers
- **Dependencies**: none

### Component Diagram

```
        api ──────────────> application ──────────> domain
         │                       │                    ▲
         │                       │ depends on ports   │
         │                       ▼                    │
         └───────────────> infrastructure ────────────┘
                                 │
                                 ▼
                            PostgreSQL
```

## Data Flow

A write follows the command path; a read follows the query path. They never cross.

```
WRITE
  POST /user  ──> UserController
                    └─> CommandBus.execute(CreateUserCommand)
                          └─> CreateUserCommandHandler
                                ├─> User.create(props)         # invariants enforced here
                                └─> IUserRepository.save(user)  # UserRepository → UserModel
                                      └─> CreateUserResponse.fromDomain(saved)

READ
  GET /user   ──> UserController
                    └─> QueryBus.execute(GetUsersQuery)
                          └─> GetUsersQueryHandler
                                └─> IUserQueries.findList(filter)  # UserQueries → read models
                                      └─> GetUsersResponse.from(rows, page, size, total)

PERMISSION CHECK
  user ──> roleId ──> RolePermission rows ──> Permission names ──> allow / deny
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Admin UI | Next.js 14, Tailwind, TanStack Query | Managing users, roles, permissions, assignments |
| API | NestJS 11, `@nestjs/swagger` | HTTP boundary, documented at `/docs` |
| Use cases | `@nestjs/cqrs` 11 | CommandBus / QueryBus |
| Domain | TypeScript classes | Aggregates and invariants |
| Persistence | Sequelize 6, `sequelize-typescript` | Repositories and query classes |
| Database | PostgreSQL 16 | Users, Roles, Permissions, RolePermissions |

## Non-Functional Requirements

### Performance

- **Permission check**: no target stated in `docs/scope.md`; not specified
- **List endpoints**: paginated by default (page 1, size 50, max 100), per the reference service

### Security

- Password hashes are never returned, logged, or placed in a read model
- The request-logging middleware must redact request bodies on credential-bearing routes
- Permission and role changes are security-sensitive per the constitution and require extra review
- No authorization model beyond the RBAC defined in `docs/scope.md` §5

### Scalability

Not specified in `docs/scope.md`. The module is stateless apart from its database, so
horizontal scaling is available if needed later.

## Constraints

- `docs/scope.md` is the single source of truth; §10 makes anything outside it a scope change
- Single role per user — `docs/scope.md` §6 places multi-role support out of scope
- Access control only — no business logic from other modules (§8)
- Backend architecture must mirror `invespy-v2-feeds-microservice` (DDD + CQRS, Sequelize)
- User activity / audit management is out of scope (§6); the `createdAt`/`modifiedOn`/`globalUId`
  columns from `BaseModel` are an architectural convention, not an audit feature

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repository scope | Standalone project; single remote; reference repos read-only | User requirement — see the constitution's *Repository Boundary* |
| Architecture | DDD + CQRS vertical slices | User requirement; layout taken from the read-only reference repo |
| ORM | Sequelize 6 + `sequelize-typescript` | User requirement |
| Database | PostgreSQL 16 | User requirement |
| Identity model | Self-contained tables in this module; no external identity provider, ever | `docs/scope.md` §4 defines the four tables directly, and the user has ruled out any third-party identity provider |
| Authentication | Credentials owned by this module; login issues a **JWT** | User's decision; `docs/scope.md` §3.1 "authenticate users where applicable" |
| Password hashing | `bcrypt`, cost 12 | Credentials are stored here, so hashing is this module's responsibility |
| Roles per user | Exactly one | `docs/scope.md` §5 diagram and §6 exclusion |
| Status model | `EntityStatus` enum (`ACTIVE`/`INACTIVE`) | Reference convention; satisfies the activate/deactivate requirements |
| Schema management | **Versioned migrations**, `synchronize: false` everywhere | Production requirement from the user; the reference service's `synchronize: true` is deliberately not followed |
| Deletion | None — deactivate only, FKs `ON DELETE RESTRICT` | `docs/scope.md` §3.1 lists no delete for any entity; confirmed by the user |
| Bootstrap | First administrator, default role, and permission catalogue created by idempotent seeds | Resolves the §2 chicken-and-egg: an authorized administrator must exist before any endpoint is callable |

---
*Generated by specs.md - fabriqa.ai FIRE Flow*
