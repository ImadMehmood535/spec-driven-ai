# Coding Standards

> Two parts: **backend** conventions derived from the read-only reference service
> `/Users/imadmehmood/projects/invespy/v2/invespy-v2-feeds-microservice`, and **frontend**
> standards for the Next.js admin UI as specified by the user.

# Backend Standards

## Overview

Derived by reading the reference service end to end. Every convention below was observed in
that codebase, not invented.

## Code Formatting

**Tool**: Prettier 3
**Config**: `.prettierrc`
**Enforcement**: `prettier/prettier: ['error', { endOfLine: 'auto' }]` via ESLint

### Key Settings

- **singleQuote**: true
- **trailingComma**: all
- **endOfLine**: auto

## Linting

**Tool**: ESLint 9 (flat config, `eslint.config.mjs`)
**Base Config**: `eslint.configs.recommended` + `typescript-eslint.configs.recommendedTypeChecked` + `eslint-plugin-prettier/recommended`
**Strictness**: type-checked rules on, with the reference service's explicit relaxations

### Key Rules

- `@typescript-eslint/no-explicit-any`: off — matches reference config
- `@typescript-eslint/no-floating-promises`: warn — matches reference config
- `@typescript-eslint/no-unsafe-argument`: warn — matches reference config
- `prettier/prettier`: error — formatting is a lint failure

## Naming Conventions

### Variables and Functions

| Element | Convention | Example |
|---------|------------|---------|
| Class | PascalCase | `CreateUserCommandHandler` |
| Interface (port) | `I` + PascalCase | `IUserRepository` |
| DI token | SCREAMING_SNAKE_CASE `Symbol` | `USER_REPOSITORY` |
| Method / function | camelCase | `findById` |
| Private aggregate field | `_camelCase` | `_entityStatus` |
| Domain constant | SCREAMING_SNAKE_CASE | `EMAIL_MAX_LENGTH` |
| Enum member | PascalCase key, SCREAMING value | `EntityStatus.Active = 'ACTIVE'` |

### Files and Folders

- **Class file**: PascalCase, one exported class per file (e.g. `UserRepository.ts`)
- **Aggregate folder**: `{Entity}Aggregate/` (e.g. `UserAggregate/`)
- **Feature slice folder**: all-lowercase, no separators (e.g. `createuser/`, `getusers/`)
- **Application module folder**: all-lowercase (e.g. `rolepermission/`)
- **Port folder**: `abstraction/` under `repositories/` and `queries/`

## File Organization

### Project Structure

```
src/
├── api/                        # HTTP boundary only — no business logic
│   ├── ApiModule.ts
│   ├── common/ApiConstants.ts  # ApiRoute + SwaggerTag const maps
│   ├── controllers/            # thin: build command/query, dispatch on bus
│   ├── filters/                # DomainExceptionFilter (APP_FILTER)
│   ├── guards/                 # JWT authentication + permission authorization
│   └── middleware/             # RequestLoggerMiddleware
├── application/                # CQRS vertical slices
│   ├── common/PaginationMeta.ts
│   └── modules/<name>/
│       ├── <Name>Module.ts     # imports CqrsModule + <Name>PersistenceModule
│       └── features/<feature>/ # Command|Query + Handler + Request + Response
├── domain/
│   ├── aggregates/BaseModel.ts # id, globalUId, createdAt, modifiedOn
│   ├── aggregates/<Name>Aggregate/
│   │   ├── <Name>.ts           # pure aggregate: private ctor, create/rehydrate
│   │   └── <Name>Model.ts      # sequelize-typescript @Table model
│   └── common/TableNames.ts    # const map of table names
├── infrastructure/
│   ├── persistence/            # DatabaseModule + per-aggregate PersistenceModule + hooks/
│   ├── repositories/           # write side, returns domain aggregates
│   │   └── abstraction/        # I<Name>Repository + Symbol token
│   └── queries/                # read side, returns flat read models
│       └── abstraction/        # I<Name>Queries + read model + filter + result types
├── migrations/                 # versioned schema migrations (up + down)
├── seeders/                    # idempotent seeds: permissions, admin role, first admin
└── shared/                     # enums, audit fields, domain errors, guards, utils
```

### Conventions

- **Layer direction**: `api → application → domain`, with `infrastructure` implementing
  ports that `application` depends on. Domain depends on nothing but `shared`.
- **Controllers**: never touch a repository, query class, or Sequelize model directly.
- **Command handlers**: depend on `I<Name>Repository` only (write side).
- **Query handlers**: depend on `I<Name>Queries` only (read side). No aggregate rehydration.
- **Repositories**: map row → aggregate via a private `toDomain(row)`.
- **Query classes**: map row → read model via a private `toReadModel(row)`.
- **Validation**: lives in the aggregate via `shared/domain/Guards`, not in DTOs.
- **One feature per folder**: `Command`/`Query`, `Handler`, `Request` (write only), `Response`.
- **Route protection**: authentication and permission checks are applied by guards in the
  `api` layer, never inside a handler.

## Import Order

```typescript
import { Injectable } from '@nestjs/common';           // 1. node + @nestjs/*
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';                        // 2. third-party
import { User } from '@domain/aggregates/UserAggregate/User';   // 3. path aliases
import { IUserRepository } from './abstraction/IUserRepository'; // 4. relative
```

**Rules**:
- Path aliases are mandatory across layers: `@api/*`, `@application/*`, `@domain/*`, `@infrastructure/*`, `@shared/*`
- Relative imports only within the same folder or an immediate child (e.g. `./CreateUserCommand`, `./abstraction/IUserRepository`)
- Alias groups appear in alphabetical order by alias, as in the reference service

## Error Handling

### Pattern

**Approach**: throw typed errors from `shared/errors`; translate to HTTP once, in `DomainExceptionFilter`

### Guidelines

- `DomainError` → HTTP 400 (invalid input, broken invariant)
- `UnauthorizedError` → HTTP 401 (no valid token, or bad credentials)
- `ForbiddenError` → HTTP 403 (valid identity, missing permission)
- `NotFoundError` → HTTP 404 (entity missing)
- `ConflictError` → HTTP 409 (duplicate, or operation blocked by a dependent row)
- Never throw `HttpException` outside the `api` layer
- Guard helpers throw `DomainError` with the message shape `` `${field} is required.` ``
- Authentication failures never reveal which half was wrong — no "unknown email" versus
  "wrong password" distinction

### Example

```typescript
export function requiredText(value: string, field: string, maxLength: number): string {
  const next = (value ?? '').trim();
  if (next.length === 0) {
    throw new DomainError(`${field} is required.`);
  }
  if (next.length > maxLength) {
    throw new DomainError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return next;
}
```

## Logging

**Tool**: `RequestLoggerMiddleware` writing to `process.stdout` (as in the reference service)
**Format**: coloured single-request block — method, URL, status, duration, then time/params/query/body

### Log Levels

| Level | Usage |
|-------|-------|
| request | Every HTTP request/response pair, via the middleware |
| error | Unhandled failures surfaced by Nest's default handler |

### Guidelines

**Always log**:
- HTTP method, path, status code, duration

**Never log**:
- Passwords, password hashes, or any credential field — the reference middleware logs the
  whole request body, so the login and user-create routes MUST have their body redacted
- JWTs, `Authorization` headers, or session identifiers

## Comments and Documentation

### When to Comment

- The reference service is almost comment-free — prefer names that explain themselves
- Comment only non-obvious invariants or a deliberate deviation from the pattern
- Never restate what the code says

### Documentation Format

**Functions**: no JSDoc in the reference service; rely on types
**Classes**: Swagger decorators (`@ApiProperty`, `@ApiOperation`, `@ApiResponse`) are the
public documentation for every Request/Response class and controller method

## Code Patterns

### Preferred Patterns

#### Aggregate with private constructor

Domain objects expose `static create(props)` for new instances and `static rehydrate(...)`
for loading from persistence. All mutation goes through intention-named methods that
delegate to guards.

```typescript
export class Role {
  private constructor(
    private readonly _id: number | null,
    private _name: string,
    private _entityStatus: EntityStatus,
  ) {}

  static create(props: RoleProps): Role {
    const role = new Role(null, '', EntityStatus.Active);
    role.rename(props.name);
    return role;
  }

  rename(name: string): void {
    this._name = requiredText(name, 'Role name', NAME_MAX_LENGTH);
  }
}
```

#### Symbol DI token beside the port

```typescript
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: number): Promise<User | null>;
}
```

Bound in the per-aggregate persistence module with
`{ provide: USER_REPOSITORY, useClass: UserRepository }` and injected with `@Inject(USER_REPOSITORY)`.

#### Response class with a static mapper

`static fromDomain(aggregate)` for command responses, `static from(rows, page, size, total)`
for paginated query responses (using `PaginationMeta.of`).

### Anti-Patterns to Avoid

- **Business logic in a controller**: controllers only translate HTTP → command/query
- **Sequelize model leaking past infrastructure**: application and api layers never import a `*Model`
- **Query handler using a repository**: read and write sides stay separate
- **Anaemic aggregate with public setters**: mutate through intention-named methods
- **Validation in the DTO instead of the aggregate**: guards live in the domain
- **Hard-coded table name strings**: always reference `TableNames`
- **Returning a password hash in any Response or read model**
- **Permission checks inside a handler**: they belong in an `api`-layer guard
- **`synchronize: true`**: schema changes ship as migrations

---

# Frontend Standards — Admin UI

> These are the user's stated UI requirements, recorded verbatim in intent and expanded into
> enforceable conventions. The governing principle the user gave: **reusability, not
> complexity.**

## Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js (App Router) + **TypeScript** — strict, no `any` in component props |
| Components | **shadcn/ui** as the primary component system |
| Styling | **Tailwind CSS** — utility-first; no CSS-in-JS, no styled-components |
| Icons | **Lucide** — the only icon set |
| Data fetching | TanStack Query for all server state |
| Forms | React Hook Form + Zod resolver |
| Tables | TanStack Table |
| Theme | next-themes for **dark mode** |
| Toasts | the shadcn/ui toast (`sonner`) |

Do not introduce a second component library, icon set, or styling approach. If shadcn/ui lacks
a primitive, compose it from the Radix primitive shadcn/ui already depends on.

## Design Language

Modern 2026 SaaS / admin-dashboard patterns, built for operators who use the tool daily.

**Aim for**: clean spacing on a consistent scale, deliberate typographic hierarchy, high
information density, enterprise-grade clarity, and one consistent design language across every
screen.

**Avoid** (explicit user instruction):
- generic or basic-looking dashboards
- excessive cards — do not wrap everything in a `Card`
- gradients
- decoration that carries no information
- unnecessary animation

Motion is limited to state transitions that aid comprehension (a sheet opening, a row
collapsing). Nothing loops, nothing bounces, nothing animates purely for effect.

## Responsiveness

Every screen works on **desktop, tablet, and mobile**. Tailwind breakpoints, mobile-first.

- Tables reflow or scroll within their own container on small screens — the page body never
  scrolls horizontally
- Dialogs become sheets on mobile where that reads better
- Navigation collapses rather than overflowing
- Touch targets stay comfortable; nothing depends on hover alone

## Accessibility

Accessible and keyboard-friendly is a requirement, not a nicety.

- Every interactive element is reachable and operable by keyboard, in a sensible tab order
- Visible focus states everywhere — never remove the focus ring without replacing it
- Dialogs, sheets, and popovers trap focus and restore it on close
- Labels tied to inputs; errors linked via `aria-describedby`
- Icon-only buttons carry an accessible name
- Prefer the Radix primitive's semantics over hand-rolled ARIA
- Colour is never the sole carrier of meaning
- Respect `prefers-reduced-motion`

## Component Reuse

**Reusability, not complexity.** The rule the user set, and the one most likely to be violated
under time pressure.

- Build one component per UI concept and reuse it. A second near-identical table, form field,
  or status badge is a defect.
- Shared building blocks live in a common components directory: data table, page header, form
  field wrapper, status badge, confirmation dialog, empty state, loading skeleton
- Compose from primitives; do not fork a shadcn/ui component to change one detail — pass props
  or use a variant
- Variants come from `class-variance-authority`, not from conditional class soup
- Extract a component when it appears twice, not in anticipation of a second use
- Keep the abstraction flat: a wrapper that only renames props earns nothing

## Required UI States

Every data-bound view handles all of these. A screen missing one is incomplete.

| State | Requirement |
|-------|-------------|
| Loading | **Skeleton** matching the real layout — never a bare spinner for initial load |
| Empty | Explains what is absent and the action that fills it |
| Error | States what failed and offers a retry; never a blank screen |
| Success | Confirmed via **toast** for mutations |
| Confirmation | Destructive or consequential actions confirm first — including deactivation and removing a permission from a role |
| Pending mutation | The triggering control disables and shows progress; no double submission |

## Tables

Tables use TanStack Table with shadcn/ui, and support — where it makes sense for that dataset:

- filtering (including a text filter on the meaningful columns)
- sorting
- pagination, wired to the API's `page` / `size` contract
- column visibility toggling
- row actions in a dropdown

Server-side pagination is the default, matching the API's `PaginationMeta`. Row actions that
change data route through the confirmation and toast conventions above.

## Forms

- React Hook Form with a Zod schema per form
- Validate on blur and on submit; show errors inline, next to the field
- Error messages say what is wrong and how to fix it — never "Invalid input"
- Client validation mirrors the server's domain rules (field lengths, required fields,
  uniqueness feedback from the API response) but the server stays authoritative
- Submit disables while pending; server-side field errors map back onto the right field
- Never clear a user's input because a submission failed

## Component Patterns

Use the richer primitives where they genuinely improve the interaction — dialogs, sheets,
popovers, dropdowns, command menus, tabs. Guidance:

| Primitive | Use for |
|-----------|---------|
| Dialog | Focused create/edit, and confirmations |
| Sheet | Detail panels and longer forms, especially on mobile |
| Dropdown menu | Row actions, overflow menus |
| Popover | Inline pickers and filters |
| Command menu | Searching a long list — e.g. picking permissions to attach to a role |
| Tabs | Splitting one entity's views without navigating away |

Chosen because it improves the task, never for decoration.

## Dark Mode

Full dark-mode support via `next-themes`, honouring the system preference with an explicit
toggle.

- Colours come from CSS custom properties / Tailwind theme tokens — never hard-coded hex in a
  component
- Both themes are checked for contrast; a component that only works in light mode is unfinished

## Security in the UI

- The JWT and the permissions it carries drive what the UI offers: controls the user cannot use
  are hidden or disabled
- **The UI is never the authorization boundary** — the API enforces it (FR-AC5–FR-AC7). Hiding
  a button is a usability decision, not a security control.
- Never render or log a password or token

## Frontend Anti-Patterns

- A second component that duplicates an existing one
- A `Card` wrapper added for visual padding alone
- A spinner where a skeleton belongs
- A mutation with no toast and no confirmation
- Hard-coded colours that break dark mode
- `div` with an `onClick` in place of a button
- A table hand-rolled instead of using the shared data table
- Business rules living in a component instead of coming from the API

---
*Generated by specs.md - fabriqa.ai FIRE Flow*
