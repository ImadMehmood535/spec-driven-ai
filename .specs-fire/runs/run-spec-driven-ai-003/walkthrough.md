---
run: run-spec-driven-ai-003
work_item: permission-crud
intent: developer-user-module
generated: 2026-09-12T16:50:00Z
mode: confirm
---

# Implementation Walkthrough: Permission Management Slice

## Summary

The first full vertical slice. Permissions can be created, viewed, listed, updated, and
activated/deactivated over HTTP, with every operation verified against a real PostgreSQL
instance. 159 tests pass.

This slice is the **template the other three entities copy**, so its shape matters more than
its size.

## The pattern, end to end

```text
POST /permission
  └─ PermissionController              thin: build command, dispatch, return
       └─ CommandBus
            └─ CreatePermissionCommandHandler      depends on IPermissionRepository only
                 ├─ Permission.create(props)       invariants enforced here
                 ├─ repository.nameExists(name)    clean 409
                 └─ repository.save(permission)    PermissionRepository → PermissionModel
                      └─ CreatePermissionResponse.fromDomain(saved)

GET /permission
  └─ PermissionController
       └─ QueryBus
            └─ GetPermissionsQueryHandler          depends on IPermissionQueries only
                 └─ queries.findList(filter)       flat read models, no aggregate
                      └─ GetPermissionsResponse.from(rows, page, size, total)
```

The write side speaks aggregates; the read side speaks read models. They never cross — there is
no `findAll` on the repository, by design.

## Files Changed

**Created (22):** the `Permission` aggregate; `IPermissionRepository` + `PermissionRepository`;
`IPermissionQueries` + `PermissionQueries`; `PermissionPersistenceModule`; `PermissionModule`;
four feature folders (`createpermission`, `getpermission`, `getpermissions`,
`updatepermission`) with their Command/Query, Handler, Request, Response; `PermissionController`;
and five spec files.

**Modified (2):** `ApiModule` registers the module and controller; `eslint.config.mjs` gains a
spec-only override.

## Key Implementation Details

### 1. Validation lives in the aggregate, and the handler proves it

`Permission.create` trims and length-checks before the handler touches the repository. A test
asserts `nameExists` is never called for a blank name — the aggregate rejects it first. That
ordering is what keeps invalid data from reaching the database at all.

### 2. Uniqueness is enforced twice on purpose

The handler calls `nameExists` so the caller gets a `409` with a useful message; the
`Permission_name_unique` constraint from run 002 is the actual guarantee. The update path passes
`exceptId` so renaming a permission to its own name is not a conflict — covered by a test.

### 3. Activate/deactivate is a status transition, not an entity concept

FR-P4 is satisfied by `PATCH {"entityStatus":"INACTIVE"}` going through
`Permission.changeStatus`, which runs `ensureEntityStatus`. `DRAFT` is rejected. This is what
FR-AC3 will later key authorization off.

### 4. The absence of DELETE is pinned by a test

D-5 forbids deletion. Rather than simply not writing the route, `PermissionController.spec.ts`
asserts `DELETE /permission/1` returns 404 and never reaches the bus. An omission can be
re-added by accident; a test cannot.

### 5. The audit hook was proven live

Creating a permission returned a `globalUId` and `createdAt` nobody passed in; the `PATCH`
stamped `modifiedOn`. Run 002 unit-tested those hooks — this run showed them working through the
full stack.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Activate/deactivate transport | `PATCH` with `entityStatus` | Matches the reference's `UpdateEventCommand`; FR-P4 needs no separate route |
| Uniqueness | Handler check + DB constraint | Clean 409 for callers, real guarantee under races |
| Spec lint override | Two rules, `**/*.spec.ts` only | Jest's typings, not defects — and narrower than loosening production rules |
| Boot-test persistence | Stub the Sequelize tokens | Keeps the real `ApiModule` under test rather than a drifting copy |

## Deviations from Plan

**One addition:** the `eslint.config.mjs` spec override, which the plan did not anticipate. The
alternative was rewriting idiomatic Jest assertions to satisfy rules that misread them.

**`AppController.spec.ts` needed a change** — not planned, but unavoidable: adding a persistence
dependency to `ApiModule` broke a test that boots it. Better to learn that now than at
`user-crud`.

## How to Verify

```bash
cd backend && npm test                    # 159 tests
cd backend && docker compose up -d && npm run migrate && npm run start:dev

curl -X POST localhost:3000/permission -H 'Content-Type: application/json' \
  -d '{"name":"project.create"}'                       # 201
curl -X POST localhost:3000/permission -H 'Content-Type: application/json' \
  -d '{"name":"project.create"}'                       # 409
curl -X PATCH localhost:3000/permission/1 -H 'Content-Type: application/json' \
  -d '{"entityStatus":"INACTIVE"}'                     # 200
curl -X DELETE localhost:3000/permission/1             # 404 — no route (D-5)
```

Swagger documents all of it at `/docs`.

## Test Coverage

- Tests added: 41 (15 aggregate, 17 handlers, 9 HTTP); 159 total
- Live API checks: 8, against real PostgreSQL
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 16/16
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated (Swagger, plan, this walkthrough)
- [x] Developer notes captured

## Developer Notes

**Copy this slice for `role-crud`, with one caution.** `GetPermissionResponse.from` uses
`Object.assign` because the read model and response happen to be identical. Where a response
diverges from its read model, map fields explicitly instead.

**`Permission.activate()`/`deactivate()` are currently unused** — the handler uses
`changeStatus`. They exist for `seed-bootstrap` and the role slice. If nothing uses them after
those land, delete them.

**Next work item**: `role-crud` (medium, confirm) — same shape, and it can run in parallel with
this one's dependents since both only need the schema.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-003*
