---
run: run-spec-driven-ai-003
work_item: permission-crud
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-12T16:35:00Z
---

# Implementation Plan: Permission Management Slice

> Checkpoint self-served under the user's standing instruction to run the loop autonomously.

## Approach

The first full vertical slice, and the template the other three entities copy. Permissions come
first because they depend on nothing else in the model.

Aggregate → repository (write) → query class (read) → CQRS features → controller. The read and
write sides stay separate: command handlers take `IPermissionRepository` and work with
aggregates; query handlers take `IPermissionQueries` and return flat read models.

## Files to Create

| File | Purpose |
|------|---------|
| `backend/src/domain/aggregates/PermissionAggregate/Permission.ts` | Aggregate: private ctor, `create`/`rehydrate`, guard-backed mutation |
| `backend/src/infrastructure/repositories/abstraction/IPermissionRepository.ts` | Write port + `PERMISSION_REPOSITORY` symbol |
| `backend/src/infrastructure/repositories/PermissionRepository.ts` | Write side, `toDomain` mapping |
| `backend/src/infrastructure/queries/abstraction/IPermissionQueries.ts` | Read port, read model, filter, result types |
| `backend/src/infrastructure/queries/PermissionQueries.ts` | Read side, `toReadModel` mapping |
| `backend/src/infrastructure/persistence/PermissionPersistenceModule.ts` | Binds and exports both tokens |
| `backend/src/application/modules/permission/PermissionModule.ts` | Registers the handlers |
| `.../features/createpermission/` | Command, Handler, Request, Response |
| `.../features/getpermission/` | Query, Handler, Response |
| `.../features/getpermissions/` | Query, Handler, Response (paginated) |
| `.../features/updatepermission/` | Command, Handler, Request, Response (includes status) |
| `backend/src/api/controllers/PermissionController.ts` | REST surface with Swagger |

## Files to Modify

| File | Changes |
|------|---------|
| `backend/src/api/ApiModule.ts` | Import `PermissionModule`, register `PermissionController` |
| `backend/src/api/common/ApiConstants.ts` | Already has `ApiRoute.Permission` / `SwaggerTag.Permission` |

## Tests

| Test File | Coverage |
|-----------|----------|
| `Permission.spec.ts` | Invariants: name required/trimmed/length, description optional, status transitions, rehydrate fidelity |
| `CreatePermissionCommandHandler.spec.ts` | Saves, returns response, 409 on duplicate name |
| `GetPermissionQueryHandler.spec.ts` | Returns read model, 404 when absent |
| `GetPermissionsQueryHandler.spec.ts` | Passes filter through, builds pagination meta |
| `UpdatePermissionCommandHandler.spec.ts` | Partial update, status change, 404 when absent, 409 on duplicate name |
| `PermissionController.spec.ts` | HTTP: create 201, get 200/404, list 200 paginated, patch 200, duplicate 409, **no delete route** |

## Technical Details

**Activate/deactivate rides on the update route** (`PATCH` with `entityStatus`), matching the
reference service's `UpdateEventCommand`. FR-P4 is satisfied by a status transition on the
aggregate via `changeStatus`, not a separate entity concept.

**Uniqueness is checked twice, deliberately.** The handler calls `nameExists(name, exceptId?)`
to return a clean 409, and the database's `Permission_name_unique` constraint is the actual
guarantee under a race. Mirrors the reference's `slugExists` pattern.

**No delete route** (D-5). The controller test asserts `DELETE` is not routed, so the absence is
pinned rather than merely omitted.

**Read models exclude nothing sensitive here** — permissions hold no credentials — but the
read/write split is still enforced so the pattern is right for `user-crud`, where it matters.

---
*Plan approved at checkpoint. Execution follows.*
