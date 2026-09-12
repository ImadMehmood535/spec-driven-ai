---
run: run-spec-driven-ai-005
work_item: role-permission-assignment
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-12T17:20:00Z
---

# Implementation Plan: Role Permission Assignment

> Checkpoint self-served under the user's standing instruction to run the loop autonomously.

## Approach

The RolePermission relationship: attach permissions to a role, remove them, list a role's
permissions. Satisfies FR-R5 and FR-RP1–FR-RP4, and implements **D-8**.

D-8 is the whole difficulty. Removal *deactivates* the link row rather than deleting it, and the
`UNIQUE(roleId, permissionId)` constraint from run 002 means a later re-assignment **cannot
insert** — it must find the existing row and reactivate it. A naive "insert on assign" breaks the
first time an operator removes a permission and adds it back.

So "already assigned" means *already assigned and active*. An inactive row is not a conflict; it
is the row to reactivate.

## Files to Create

| File | Purpose |
|------|---------|
| `.../RolePermissionAggregate/RolePermission.ts` | Aggregate with `activate`/`deactivate` |
| `.../repositories/abstraction/IRolePermissionRepository.ts` | Write port + symbol |
| `.../repositories/RolePermissionRepository.ts` | Write side, incl. `findByRoleAndPermission`, transactional bulk assign |
| `.../queries/abstraction/IRolePermissionQueries.ts` | Read port, read model joined to Permission |
| `.../queries/RolePermissionQueries.ts` | Read side, active links only by default |
| `.../persistence/RolePermissionPersistenceModule.ts` | Binds both tokens |
| `.../modules/rolepermission/RolePermissionModule.ts` | Handler registration |
| `.../features/assignpermissions/` | Command, Handler, Request, Response |
| `.../features/removepermission/` | Command, Handler, Response |
| `.../features/getrolepermissions/` | Query, Handler, Response |
| `RolePermissionController.ts` | Role-scoped routes |

## Files to Modify

| File | Changes |
|------|---------|
| `api/ApiModule.ts` | Register module + controller |
| `api/controllers/AppController.spec.ts` | Stub the `RolePermissionModel` token |

## Tests

| Test File | Coverage |
|-----------|----------|
| `RolePermission.spec.ts` | Invariants, activate/deactivate, status guard |
| `AssignPermissionsCommandHandler.spec.ts` | Single and multiple assign, **reactivation of a previously removed link**, 409 only when already *active*, 404 missing role, 404 missing permission, atomicity |
| `RemovePermissionCommandHandler.spec.ts` | Deactivates rather than deletes, 404 when link absent, idempotent on an already-inactive link |
| `GetRolePermissionsQueryHandler.spec.ts` | Returns permission details not bare ids, excludes inactive links |
| `RolePermissionController.spec.ts` | HTTP: assign 201, remove 200, list 200, 409, 404, no entity-delete route |

Plus live verification of the full remove → re-assign cycle against the real database, which is
the only way to prove the unique constraint is not violated.

## Technical Details

**Atomicity for multi-assign** means a transaction — the first place this module needs one. A
partial assignment would leave a role with some of the requested permissions and no error the
caller could act on.

**Routes are role-scoped** (`/role/:roleId/permission...`), since every operation is "this
role's permissions".

**Removal is not an entity delete**, so it does not conflict with D-5. The link row survives;
only its `entityStatus` changes.

---
*Plan approved at checkpoint. Execution follows.*
