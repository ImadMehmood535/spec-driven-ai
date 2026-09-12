---
run: run-spec-driven-ai-007
work_item: permission-resolution
intent: developer-user-module
mode: validate
checkpoint: plan
approved_at: 2026-09-12T18:45:00Z
---

# Implementation Plan: Effective Permission Resolution

> Checkpoints 1 and 2 self-served under the standing instruction. Design doc:
> `.specs-fire/intents/developer-user-module/work-items/permission-resolution-design.md`

## Approach

Read side only — a query class, no repository, no aggregate. One SQL query walks
`User → Role → RolePermission → Permission` with a status gate at each of the four hops
(FR-AC3). Two features: resolve the set, and check a single action.

## Files to Create

`IUserPermissionQueries` + symbol; `UserPermissionQueries` (the four-gate SQL);
`UserPermissionPersistenceModule`; `getuserpermissions` and `checkuserpermission` features;
`UserPermissionController`; two spec files.

## Files to Modify

`api/ApiModule.ts`; `AppController.spec.ts` routing assertion.

## Tests

Handler-level: 404 for an unknown user, empty set for an existing user with none, exact
matching, case sensitivity, trimming, blank-name rejection.

**The four gates are verified against a live database, not by unit test** — they live in raw
SQL, so a mocked query proves nothing about them. Each gate is exercised by deactivating exactly
one hop with the other three active.

## Technical Details

**`DISTINCT`** so a role granting the same permission twice cannot produce duplicates.

**Existence is checked before resolution.** A non-existent user is 404; an existing but inactive
one is 200 with an empty set. Conflating them would let a caller read "unknown id" as
"legitimately denied".

**No caching.** Nothing in the scope asks for it, and staleness in an authorization path is a
liability. `authentication-login` will embed permissions in a JWT, which does introduce
staleness — that trade-off belongs to that work item.

---
*Plan approved at checkpoint. Execution follows.*
