---
run: run-spec-driven-ai-005
work_item: role-permission-assignment
intent: developer-user-module
generated: 2026-09-12T17:50:00Z
mode: confirm
---

# Implementation Walkthrough: Role Permission Assignment

## Summary

Roles can now be given permissions, have them removed, and have them listed. Satisfies FR-R5
and FR-RP1–FR-RP4, and implements **D-8**: removal deactivates the link and re-assignment
reactivates the same row.

234 tests pass. The full assign → remove → re-assign cycle was driven against a real database
with row-level checks.

## The D-8 problem, and why it needed care

`UNIQUE (roleId, permissionId)` from run 002 plus "removal deactivates rather than deletes"
means a re-assignment **cannot insert**. The obvious implementation breaks the first time an
operator removes a permission and adds it back:

```
duplicate key value violates unique constraint
  "RolePermission_roleId_permissionId_unique"
```

Two things follow, and both are in the code:

1. **`assignMany` reactivates.** Inside the transaction: find the row for this
   (role, permission); if it exists, set `ACTIVE`; otherwise insert.
2. **"Already assigned" means already assigned *and active*.** The conflict check compares
   against `activePermissionIds`, not all links. Comparing against all rows would return 409
   forever after a single removal — the feature would look implemented and be unusable.

Proven live:

```
assign [1,2,3]            → 3 rows, all ACTIVE
remove 2                  → row id 2 survives as INACTIVE; list returns [1,3]
re-assign 2               → row id 2 back to ACTIVE; table still holds 3 rows, not 4
```

## Files Changed

**Created (17):** `RolePermission` aggregate; `IRolePermissionRepository` +
`RolePermissionRepository` (transactional `assignMany`); `IRolePermissionQueries` +
`RolePermissionQueries` (joined to Permission, active-only by default);
`RolePermissionPersistenceModule`; `RolePermissionModule`; three feature folders
(`assignpermissions`, `removepermission`, `getrolepermissions`); `RolePermissionController`;
four spec files.

**Modified (2):** `ApiModule` registration; `AppController.spec.ts` rewritten.

## Key Implementation Details

### 1. Multi-assign is atomic

`assignMany` runs in a `sequelize.transaction`. A partial assignment would leave a role holding
some of the requested permissions with no error the caller could act on. The find-or-reactivate
lookup is transaction-scoped too, so a concurrent assign cannot read a stale absence.

### 2. Removal is idempotent

Removing an already-removed permission returns `200` with `INACTIVE`. The operator's intent is
already satisfied; failing would be noise.

### 3. A missing role is 404, not an empty list

"That role does not exist" and "that role has no permissions" are different answers. Returning
`[]` for a typo'd id would quietly mislead.

### 4. `DELETE` that does not delete

`DELETE /role/:roleId/permission/:permissionId` is the right verb for removing a permission from
a role, and it deactivates the link rather than deleting a row — so D-5 still holds. The
response carries `linkStatus: "INACTIVE"` and the Swagger summary says "deactivates the link",
so consumers are not misled.

### 5. The boot test, third time around

`AppController.spec.ts` has broken in three consecutive runs as `ApiModule` gained
dependencies — this time because `RolePermissionRepository` injects the Sequelize connection for
its transaction, which production provides globally via `forRoot`. Rather than bolt on another
stub, the test now supplies the connection from a small `@Global` module, explains why in a
comment, and **adds an assertion that every registered controller routes**. A recurring
irritation became coverage: a forgotten controller registration now fails loudly.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Conflict definition | Already assigned **and active** | An inactive row is the row to reactivate, not a conflict (D-8) |
| Reactivation location | Inside `assignMany`'s transaction | A non-transactional find could read a stale absence and attempt a duplicate insert |
| Removal semantics | Idempotent | The operator's intent is already satisfied |
| `activePermissionIds` on the write port | Accepted | A command needs it for its conflict check; routing it through the read side would make a command depend on read models |
| Missing role on list | 404 | Distinguishes "absent" from "has none" |

## Deviations from Plan

None in substance. The plan anticipated the reactivation problem, the transaction, and the
role-scoped routes. The boot test rewrite was larger than planned — it gained a controller
routing assertion rather than just another stub.

## How to Verify

```bash
cd backend && npm test        # 234 tests

curl -X POST localhost:3000/role/1/permission -H 'Content-Type: application/json' \
  -d '{"permissionIds":[1,2,3]}'                    # 201
curl -X DELETE localhost:3000/role/1/permission/2   # 200, linkStatus INACTIVE
curl localhost:3000/role/1/permission               # permissions 1 and 3 only
curl -X POST localhost:3000/role/1/permission -H 'Content-Type: application/json' \
  -d '{"permissionIds":[2]}'                        # 201 — reactivates row 2

docker exec developer-user-db psql -U postgres -d developer_user \
  -c 'select id, "permissionId", "entityStatus" from "RolePermission" order by id;'
# 3 rows, all ACTIVE — no duplicate was created
```

## Test Coverage

- Tests added: 33; 234 total
- Live API checks: 13, including row-level verification of the D-8 cycle
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 14/14
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**`permission-resolution` depends on this slice's status semantics.** FR-AC3 must exclude
permissions reached through an inactive *link*, which is exactly what `linkStatus` records.
`RolePermissionQueries.findByRole` already filters on it by default — resolution should follow
the same rule rather than inventing its own.

**Permission existence is checked one query per id.** Fine for a handful; if assignment ever
takes hundreds, switch to a single `IN` query.

**Next work item**: `user-crud` (high, validate) — two checkpoints, and the first slice touching
credentials. Explicitly **not** a candidate for generation-by-substitution.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-005*
