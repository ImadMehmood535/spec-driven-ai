---
id: developer-user-module
title: Developer User Module
status: in_progress
created: 2026-09-12T11:47:10Z
---

# Intent: Developer User Module

> **Source of truth**: `docs/scope.md`. Every requirement below traces to a section of that
> document; the trace is shown in the `Scope ref` column of each requirement table. Nothing in
> this brief adds functionality beyond that scope. Where the scope is silent, the gap is
> recorded as an open question rather than filled in — per `docs/scope.md` §10.

## Goal

Provide a centralized, structured, Role-Based Access Control system for the Developer platform:
manage users, roles, and permissions; assign permissions to roles and a role to each user; and
determine whether a given user may perform a given action.

## Users

- **Developer platform administrator** — the authorized actor. Creates and manages users,
  roles, and permissions, assigns permissions to roles and roles to users, and activates or
  deactivates any of them. (`docs/scope.md` §2)
- **Developer platform user** — the subject of access control. Authenticates, and receives
  permissions through the single role assigned to them. (§5)
- **Other Developer platform modules** — consumers of the permission-check capability; they
  ask whether a user may perform an action. (§9.6)

## Problem

The Developer platform has no centralized access-control system. Without one there is no
single place that defines which users can reach which features, and no consistent way for any
other module to determine what a user is allowed to do. (§1, §2)

## Success Criteria

Taken directly from `docs/scope.md` §9:

- Users can be managed (§9.1)
- Roles can be managed (§9.2)
- Permissions can be managed (§9.3)
- Permissions can be assigned to roles (§9.4)
- Users can be assigned roles (§9.5)
- The system can determine whether a user has permission to perform an action (§9.6)
- The implementation follows the defined project architecture and development standards (§9.7)
  — i.e. the DDD + CQRS vertical-slice architecture recorded in
  `.specs-fire/standards/system-architecture.md` and the conventions in
  `.specs-fire/standards/coding-standards.md`

## Constraints

- `docs/scope.md` is the single source of truth. Per §10, anything not defined there is a
  scope change requiring review before implementation.
- **Access control only.** No business logic belonging to another module; project
  functionality stays in the Project module. (§8)
- **One role per user.** Multi-role support is out of scope unless specifically required. (§6)
- **No custom permission logic** outside the defined RBAC model. (§6)
- Out of scope per §6: project management, project inventory, property/unit management, CRM,
  lead management, sales management, financial management, reporting/analytics, notifications,
  developer company management, user activity/audit management.
- **Standalone project.** This repository belongs to no other repository or estate. The only
  writable location is `/Users/imadmehmood/projects/invespy/spec-driven-ai`; the reference repo
  is read-only. Single git remote:
  `https://github.com/ImadMehmood535/spec-driven-ai.git`. See
  `.specs-fire/standards/constitution.md` → *Repository Boundary*, and D-0.
- Backend must follow the architecture of
  `/Users/imadmehmood/projects/invespy/v2/invespy-v2-feeds-microservice` — NestJS 11,
  DDD + CQRS vertical slices, Sequelize over PostgreSQL. That repo is a **reference for layout
  only**: patterns are followed, code is re-authored here, and nothing is ever written to it.
  (user requirement)
- Admin UI in Next.js. (user requirement)
- Authentication — credentials and login — is owned by this module, issuing a JWT.
  (user's decisions at init and on review; resolves the §3.1 ambiguity "authenticate users
  where applicable" — see D-2)
- Schema managed by production-grade migrations, never `synchronize`. (see D-1)
- No delete operations. (see D-5)

---

## Requirements

Each requirement is a statement of *what*, traced to the scope. Implementation detail is
deliberately absent — that belongs to work-item decomposition.

### FR-U · Users (§3.1 Users)

| ID | Requirement | Scope ref |
|----|-------------|-----------|
| FR-U1 | An administrator can create a user | §3.1 Create user |
| FR-U2 | An administrator can view a single user, and view a list of users | §3.1 View user |
| FR-U3 | An administrator can update a user's information | §3.1 Update user, Manage user information |
| FR-U4 | An administrator can activate or deactivate a user | §3.1 Activate/deactivate user |
| FR-U5 | An administrator can assign a role to a user; a user has at most one role | §3.1 Assign role to user; §5; §6 (multi-role out of scope) |
| FR-U6 | A user can be authenticated by verifying their credentials | §3.1 Authenticate users where applicable |
| FR-U7 | A deactivated user cannot be authenticated | §3.1 (activate/deactivate + authenticate, read together) |

### FR-R · Roles (§3.1 Roles)

| ID | Requirement | Scope ref |
|----|-------------|-----------|
| FR-R1 | An administrator can create a role | §3.1 Create role |
| FR-R2 | An administrator can view a single role, and view a list of roles | §3.1 View role |
| FR-R3 | An administrator can update a role | §3.1 Update role |
| FR-R4 | An administrator can activate or deactivate a role | §3.1 Activate/deactivate role |
| FR-R5 | An administrator can assign permissions to a role | §3.1 Assign permissions to a role |

### FR-P · Permissions (§3.1 Permissions)

| ID | Requirement | Scope ref |
|----|-------------|-----------|
| FR-P1 | An administrator can create a permission | §3.1 Create permission |
| FR-P2 | An administrator can view a single permission, and view a list of permissions | §3.1 View permission |
| FR-P3 | An administrator can update a permission | §3.1 Update permission |
| FR-P4 | An administrator can activate or deactivate a permission | §3.1 Activate/deactivate permission |
| FR-P5 | A permission carries a permission/action name identifying the action it grants (e.g. `project.create`) | §3.1 Define permission/action names; §5 example |

### FR-RP · Role Permissions (§3.1 Role Permissions)

| ID | Requirement | Scope ref |
|----|-------------|-----------|
| FR-RP1 | An administrator can assign one or more permissions to a role | §3.1 Assign permissions to roles |
| FR-RP2 | An administrator can remove a permission from a role | §3.1 Remove permissions from roles |
| FR-RP3 | An administrator can view the permissions assigned to a role | §3.1 View permissions assigned to a role |
| FR-RP4 | The same permission cannot be assigned to the same role twice | §3.1 Manage role-permission relationships (relationship integrity) |

### FR-AC · Access Decision (§9.6)

| ID | Requirement | Scope ref |
|----|-------------|-----------|
| FR-AC1 | The system can determine whether a user has permission to perform an action | §9.6 |
| FR-AC2 | A user's permissions are exactly those of their assigned role, resolved through role permissions | §5 access model |
| FR-AC3 | The effective permission set excludes anything reached through a deactivated user, role, permission, or role-permission link | §3.1 activate/deactivate (all four entities) read against §9.6 |
| FR-AC4 | A user with no assigned role has no permissions | §5 (permissions arrive only via a role) |
| FR-AC5 | Every route in this module except login requires a valid JWT; an absent, malformed, or expired token is rejected | §2 "authorized administrators"; D-7 |
| FR-AC6 | Each management route additionally requires the permission governing that operation — the module enforces its own RBAC on itself | §2; D-7 |
| FR-AC7 | A request whose token carries a valid identity but lacks the required permission is refused as forbidden, distinctly from an unauthenticated request | §2; D-7 |

### FR-S · Seeding and Bootstrap

Decided on review (D-4, D-6). These exist to make §2 workable — an "authorized administrator"
must exist before any endpoint can be called — and add no entity beyond `docs/scope.md` §4.

| ID | Requirement | Scope ref |
|----|-------------|-----------|
| FR-S1 | A seed creates the permission catalogue from the §5 action names (`project.create`, `project.update`, `project.delete`, `project.view`) | §5 example; D-4 |
| FR-S2 | A seed creates a default administrator role | §2; D-4 |
| FR-S3 | A seed creates the first administrator user, assigned that role, with credentials taken from environment configuration | §2; D-6 |
| FR-S4 | Seeds are idempotent — re-running them creates no duplicates and does not reset an existing administrator's credentials | D-4, D-6 |
| FR-S5 | Seeds are separate from schema migrations and independently runnable | D-1, D-4 |
| FR-S6 | The seed also creates this module's own permission names — the ones FR-AC6 requires on its management routes (user, role, permission, and role-permission operations) | §2; D-7 |
| FR-S7 | The seeded administrator role holds **every** permission the module defines, so the bootstrap administrator has full access with no manual configuration | §2; D-7 |

### FR-UI · Admin UI

The scope defines no UI; the admin surface was chosen by the user at init, and the design
guidelines were given by the user on review. These requirements add no capability beyond §3.1 —
each screen exposes requirements already listed above.

**Stack** (user-specified): Next.js + TypeScript, shadcn/ui as the primary component system,
Tailwind CSS, Lucide icons. Full conventions in `.specs-fire/standards/coding-standards.md` →
*Frontend Standards*.

| ID | Requirement | Scope ref |
|----|-------------|-----------|
| FR-UI1 | Administrators can manage users through a UI: list, view, create, update, activate/deactivate, assign role | FR-U1 – FR-U5 |
| FR-UI2 | Administrators can manage roles through a UI: list, view, create, update, activate/deactivate | FR-R1 – FR-R4 |
| FR-UI3 | Administrators can manage permissions through a UI: list, view, create, update, activate/deactivate | FR-P1 – FR-P4 |
| FR-UI4 | Administrators can view, assign, and remove a role's permissions through a UI | FR-RP1 – FR-RP3 |
| FR-UI5 | A user can log in through the UI | FR-U6 |
| FR-UI6 | Controls the signed-in user lacks permission for are hidden or disabled; the UI is never the authorization boundary | FR-AC6, D-7 |
| FR-UI7 | Every data-bound view handles loading (skeleton), empty, error-with-retry, success (toast), and confirmation states | user UI guidelines |
| FR-UI8 | Tables support filtering, sorting, pagination, column visibility, and row actions where appropriate | user UI guidelines |
| FR-UI9 | Forms validate with clear, specific error messages and preserve input on failure | user UI guidelines |
| FR-UI10 | The UI is responsive across desktop, tablet, and mobile | user UI guidelines |
| FR-UI11 | Components are accessible and keyboard-operable, with visible focus and correct focus handling in overlays | user UI guidelines |
| FR-UI12 | Dark mode is supported throughout | user UI guidelines |
| FR-UI13 | Shared components are reused, not duplicated — one component per UI concept | user UI guidelines ("reusability not complexity") |

### NFR · Non-functional

| ID | Requirement | Source |
|----|-------------|--------|
| NFR-1 | Backend follows the DDD + CQRS vertical-slice architecture and the recorded coding standards | §9.7; `.specs-fire/standards/` |
| NFR-2 | Every endpoint is documented with Swagger decorators | coding standards; reference service |
| NFR-3 | Password hashes are never returned in a response, written to a log, or placed in a read model | constitution; security |
| NFR-4 | List endpoints are paginated (default page 1, size 50, max 100) | reference service convention |
| NFR-5 | Domain errors map to HTTP 400 / 401 / 403 / 404 / 409 through a single exception filter | reference service convention; D-7 |
| NFR-6 | Critical access-control paths are covered by tests — **backend and frontend both** | `.specs-fire/standards/testing-standards.md`; user requirement |
| NFR-7 | Schema is managed by versioned migrations with working `up` and `down`; `synchronize` is `false` in every environment | D-1 |
| NFR-8 | JWT signing secret, token lifetime, and seed administrator credentials come from environment configuration and are never committed | D-2, D-6; constitution |
| NFR-9 | All work stays inside this repository; the reference repo is never written to, and only the one git remote is used | constitution → Repository Boundary; D-0 |

### Explicitly NOT required

Restating `docs/scope.md` §6 as a guard for decomposition: no project management, project
inventory, property/unit management, CRM, lead management, sales management, financial
management, reporting/analytics, notifications, developer company management, user
activity/audit management, multi-role support, or custom permission logic outside the RBAC
model. Also absent from the scope and therefore **not** requirements: user self-registration,
password reset / forgot-password, email verification, invitations, MFA, permission grouping or
hierarchy, wildcard permissions, and permission assignment directly to a user.

---

## Data Model (decided)

`docs/scope.md` §4 names the four tables and their relationship but lists no columns. The
fields below are the minimum needed to satisfy the requirements above, shaped by the reference
service's `BaseModel` (`id`, `globalUId`, `createdAt`, `modifiedOn`) and `EntityStatus` enum.
**Decided per D-3** — the user delegated the field choice to this specification. Every column
traces to a requirement; nothing is present for a feature `docs/scope.md` §6 excludes.
The tables are created by migration, not `synchronize` (D-1).

**Users** — stores Developer platform user information (§4)

| Field | Type / rule | Purpose | Traces to |
|-------|-------------|---------|-----------|
| `id` | BIGINT, PK, autoincrement | surrogate key | architecture |
| `globalUId` | UUID, not null | external identifier | architecture |
| `roleId` | BIGINT, FK → Roles, **nullable** | the user's single role; null until assigned | FR-U5, FR-AC4 |
| `email` | VARCHAR(255), not null, **unique** | identity and login identifier | FR-U1, FR-U6 |
| `username` | VARCHAR(255), not null, **unique** | identity and login identifier | FR-U1, FR-U6 |
| `firstName` | VARCHAR(255), not null | user information | FR-U3 |
| `lastName` | VARCHAR(255), not null | user information | FR-U3 |
| `passwordHash` | VARCHAR(255), not null | credential verification; never selected into a read model, never returned, never logged | FR-U6, NFR-3 |
| `entityStatus` | ENUM ACTIVE / INACTIVE, not null | activate / deactivate | FR-U4, FR-U7 |
| `createdAt` | TIMESTAMPTZ, not null | audit column convention | architecture |
| `modifiedOn` | TIMESTAMPTZ, nullable | audit column convention | architecture |

Nullable `roleId` is deliberate: FR-AC4 requires a user with no role to have no permissions,
which presumes a user can exist without one. No `lastLoginAt`, `failedAttempts`, or similar
column — that is user-activity tracking, excluded by `docs/scope.md` §6.

**Roles** — stores available user roles (§4)

| Field | Type / rule | Purpose | Traces to |
|-------|-------------|---------|-----------|
| `id` | BIGINT, PK, autoincrement | surrogate key | architecture |
| `globalUId` | UUID, not null | external identifier | architecture |
| `name` | VARCHAR(255), not null, **unique** | role name (e.g. "Developer Admin") | FR-R1, §5 example |
| `description` | VARCHAR(512), nullable | human description | FR-R3 |
| `entityStatus` | ENUM ACTIVE / INACTIVE, not null | activate / deactivate | FR-R4 |
| `createdAt` | TIMESTAMPTZ, not null | audit column convention | architecture |
| `modifiedOn` | TIMESTAMPTZ, nullable | audit column convention | architecture |

**Permissions** — stores available system permissions (§4)

| Field | Type / rule | Purpose | Traces to |
|-------|-------------|---------|-----------|
| `id` | BIGINT, PK, autoincrement | surrogate key | architecture |
| `globalUId` | UUID, not null | external identifier | architecture |
| `name` | VARCHAR(255), not null, **unique** | permission / action name (e.g. `project.create`) | FR-P5 |
| `description` | VARCHAR(512), nullable | human description | FR-P3 |
| `entityStatus` | ENUM ACTIVE / INACTIVE, not null | activate / deactivate | FR-P4 |
| `createdAt` | TIMESTAMPTZ, not null | audit column convention | architecture |
| `modifiedOn` | TIMESTAMPTZ, nullable | audit column convention | architecture |

**Role Permissions** — stores the relationship between roles and permissions (§4)

| Field | Type / rule | Purpose | Traces to |
|-------|-------------|---------|-----------|
| `id` | BIGINT, PK, autoincrement | surrogate key | architecture |
| `globalUId` | UUID, not null | external identifier | architecture |
| `roleId` | BIGINT, FK → Roles, not null | the role side of the link | FR-RP1 |
| `permissionId` | BIGINT, FK → Permissions, not null | the permission side | FR-RP1 |
| — | **UNIQUE (`roleId`, `permissionId`)** | a permission cannot be assigned to a role twice | FR-RP4 |
| `entityStatus` | ENUM ACTIVE / INACTIVE, not null | link-level activate / deactivate | FR-AC3 |
| `createdAt` | TIMESTAMPTZ, not null | audit column convention | architecture |
| `modifiedOn` | TIMESTAMPTZ, nullable | audit column convention | architecture |

Relationship, per §4 and §5: `User → Role → Role Permissions → Permissions`.

**Foreign-key behaviour.** Because no entity is ever deleted (D-5), every foreign key is
`ON DELETE RESTRICT`. Retirement happens through `entityStatus`, so no cascade is needed and
no row is orphaned.

**JWT claims** (D-2), derived at login from the tables above:

| Claim | Source |
|-------|--------|
| subject | user `globalUId` |
| username | user `username` |
| role | assigned role `name`, or absent when `roleId` is null |
| permissions | active permission names reachable via active role-permission links (FR-AC2, FR-AC3) |
| issued-at / expiry | token lifetime from environment configuration |

The hash in `passwordHash` never appears in a claim.

---


## Resolved Decisions

Every open question from the first draft has been answered by the user (2026-09-12). Nothing
below is an assumption.

**D-0 — Standalone project, no external identity provider.** This repository is a standalone
project. It belongs to no other repository or service estate.
`invespy-v2-feeds-microservice` was referenced **only** for its DDD / CQRS /
clean-architecture layout — nothing else about it, and no other Invespy repository, bears on
this module. There is no link to any other `User` table, no shared database, and no
cross-repository dependency. The absolute rule is recorded in
`.specs-fire/standards/constitution.md` → *Repository Boundary*.

This module also owns identity, credentials, roles, and permissions outright, in its own
PostgreSQL tables, exactly as `docs/scope.md` §4/§5 describes. **No third-party identity
provider or identity service is used, now or later** — Keycloak included.
*(resolves former OQ-1)*

**D-1 — Production migrations.** Schema is managed by proper versioned migrations, not
`synchronize`. `synchronize` is set to `false` in every environment; the reference service's
`synchronize: true` is explicitly **not** followed here. Every schema change ships as a
migration with a working `up` and `down`, applied in CI and in deployment before the app boots.
Seeds are separate from migrations.
*(resolves former OQ-2)*

**D-2 — JWT authentication.** Successful credential verification returns a signed JWT. The
signing secret and token lifetime come from environment configuration; the secret is never
committed. Token claims carry the user identifier, their role, and their effective permission
names, so other modules can authorize without a round-trip per check.
Refresh tokens, logout/token revocation, and password reset are **not** in scope — the scope
defines none of them, so adding any is a scope change per `docs/scope.md` §10.
*(resolves former OQ-3)*

**D-3 — Field sets decided.** As a standalone project the module owns its own schema outright,
and the user delegated the field choice. The columns in *Data Model* below are now **decided**,
not derived-pending-confirmation. They are deliberately minimal: every column traces to a
requirement, and nothing was added for a feature the scope excludes.
*(resolves former OQ-4)*

**D-4 — Seed data is in scope.** The module ships seeds, separate from migrations and
idempotent (re-running changes nothing):
1. The **permission catalogue** — the action names from `docs/scope.md` §5
   (`project.create`, `project.update`, `project.delete`, `project.view`). Permissions for
   other modules are added later by administrators or by a later scope change; this module
   does not attempt to enumerate another module's actions.
2. A **default administrator role** holding every permission the module defines (see D-7).
3. The **first administrator user**, assigned that role — see D-6.
*(resolves former OQ-5)*

**D-5 — No delete, anywhere.** Confirmed: no delete operation for users, roles, permissions, or
role-permission links. Deactivation (`entityStatus`) is the only retirement mechanism, matching
`docs/scope.md` §3.1, which lists activate/deactivate for all four entities and delete for
none. Removing a permission *from a role* (FR-RP2) is a relationship change, not an entity
delete, and remains in scope.
*(resolves former OQ-6)*

**D-6 — First administrator comes from seed.** The bootstrap administrator is created by the
seed, not by an API call. Its initial credentials come from environment configuration — never
hard-coded, never committed — and the seed is idempotent so re-running it does not reset an
existing administrator. This closes the chicken-and-egg problem in `docs/scope.md` §2: the
first "authorized administrator" exists before any endpoint is called.
*(resolves former OQ-7)*

**D-7 — The module's own routes are protected, and the seeded administrator has full access.**
Confirmed by the user. Every route except login requires a valid JWT, and each management route
requires the permission governing it — this module enforces access control on itself using the
very RBAC it defines (`docs/scope.md` §2 "authorized administrators"). The seeded administrator
role holds **every** permission this module defines, so the bootstrap administrator has
complete access from the first login with nothing left to configure by hand. This extends D-4:
the seed grants the admin role the full permission set, not only the four §5 project actions.
*(resolves the last remaining open question)*

**Ordering consequence.** Self-enforcement can only land after the permission-check capability
(FR-AC1) exists, and the module's own permission names (FR-S6) must be seeded before any route
can require them. Decomposition must sequence: schema → permission resolution → seeds →
route protection.

**D-8 — Removing a permission from a role deactivates the link.** `FR-RP2` removal sets the
`RolePermission` row's `entityStatus` to `INACTIVE` rather than deleting it. The row stays,
history is preserved, and `FR-AC3` already excludes inactive links from permission resolution.
Re-assigning a previously removed permission reactivates the existing row instead of inserting
a duplicate — which keeps the `UNIQUE (roleId, permissionId)` constraint satisfied and
`FR-RP4` intact. Consistent with D-5: nothing in this module is ever deleted.

**D-9 — An administrator can change another user's password.** `FR-U3` ("manage user
information") includes setting a new password for a user. The new value is hashed through the
same port as creation, the hash is never returned, and the request body is redacted in logs.
This is an administrator-initiated change only — it is **not** a password-reset flow: no
self-service, no email token, no expiry. Those remain out of scope (D-2).

**D-10 — The browser stores the JWT in client-side storage.** The admin UI keeps the token in
browser storage so a page refresh does not force re-login. Consequence to accept knowingly: a
token in `localStorage` is readable by any script running on the page, so an XSS bug becomes a
token disclosure. Mitigation is to keep the surface small — no untrusted HTML rendering, no
third-party script tags in the admin app, and the token cleared on sign-out along with the
query cache. Since D-2 issues no refresh token, expiry means re-login.

**D-11 — E2E tests isolate by unique per-run data.** Because nothing is deletable (D-5),
Playwright specs generate unique names per run (a run-scoped suffix on permission, role, and
user names) rather than cleaning up after themselves. Each spec sets up what it needs and
asserts only on its own data, so suites are independent and re-runnable without truncation. A
local script may reset the database between runs for convenience, but no test depends on it.

### Still open

Nothing. Every question raised in the first draft, and every decision deferred during
decomposition, has been answered.

## Notes

**Repository analysis.** This repository is greenfield: it contained only `docs/scope.md`,
`.claude/`, and `.specsmd/` — no source, no dependency manifest, no monorepo indicators.
Classified `greenfield` / `monolith`. A git remote now exists —
`https://github.com/ImadMehmood535/spec-driven-ai.git` — and is the only one this project uses.

**Architecture source (read-only).** Standards in `.specs-fire/standards/` were derived by
reading `invespy-v2-feeds-microservice` end to end — every convention recorded there (layer layout,
aggregate shape with private constructor + `create`/`rehydrate`, `Symbol` DI tokens beside
ports, separate repository/query sides, `DomainExceptionFilter` error mapping, audit hooks,
`ApiRoute`/`SwaggerTag` const maps, pagination defaults, ESLint/Prettier settings) was observed
in that codebase rather than invented.

**Testing gap in the reference.** That service configures Jest but contains no test files. The
coverage expectations in `.specs-fire/standards/testing-standards.md` are this project's own
addition, on the grounds that an access-control module should not inherit that gap. Flagging it
because it is a deviation from "follow the reference", not a scope change.

**Frontend precedent (read-only).** The existing Invespy frontend
(`/Users/imadmehmood/projects/invespy/current/invespy`) is Next.js 14 with Tailwind,
Radix/shadcn, and TanStack Query; the admin UI standards follow that shape, in TypeScript. Like
the backend reference, it was read for conventions only and is never written to — the admin UI
is authored fresh in this repository.

**Repository boundary.** Recorded as an absolute rule in
`.specs-fire/standards/constitution.md`, which modules cannot override: the only writable
location is `/Users/imadmehmood/projects/invespy/spec-driven-ai`, the reference repos are
read-only, and `https://github.com/ImadMehmood535/spec-driven-ai.git` is the single remote.

**Not yet done.** Work-item decomposition has not run. No implementation has started; no code
exists in this repository.
