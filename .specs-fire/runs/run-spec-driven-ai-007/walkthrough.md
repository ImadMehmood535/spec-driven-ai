---
run: run-spec-driven-ai-007
work_item: permission-resolution
intent: developer-user-module
generated: 2026-09-12T19:05:00Z
mode: validate
---

# Implementation Walkthrough: Effective Permission Resolution

## Summary

The module can now answer the question it exists to answer: **may this user perform this
action?** Satisfies FR-AC1–FR-AC4 and success criterion §9.6.

318 tests pass. All four FR-AC3 status gates were proven independently against a live database.

## The whole thing, in one query

```sql
SELECT DISTINCT p."name"
  FROM "User" u
  JOIN "Role" r            ON r."id" = u."roleId"
  JOIN "RolePermission" rp ON rp."roleId" = r."id"
  JOIN "Permission" p      ON p."id" = rp."permissionId"
 WHERE u."id" = :userId
   AND u."entityStatus"  = 'ACTIVE'   -- gate 1: the user
   AND r."entityStatus"  = 'ACTIVE'   -- gate 2: the role
   AND rp."entityStatus" = 'ACTIVE'   -- gate 3: the link (D-8 removal)
   AND p."entityStatus"  = 'ACTIVE'   -- gate 4: the permission
 ORDER BY p."name" ASC
```

Two properties fall out of the structure rather than out of discipline:

- **FR-AC2** — permissions can *only* arrive via a role. There is no user→permission path in
  the query, so a direct grant is not something a future developer could add by accident; they
  would have to write a different query.
- **FR-AC4** — a user with a null `roleId` matches no rows under the `INNER JOIN`, so they hold
  nothing. Asserted by a test and a live check anyway, rather than trusting the reader to notice.

## Why the gates were verified live

They are raw SQL. A unit test with a mocked query class would only re-test the mock — it would
assert nothing about whether the four predicates are present and correct. So each gate was
exercised through the API against real rows, deactivating exactly one hop with the other three
active:

| Gate | Action | Resolved |
|------|--------|----------|
| baseline | all active | `["project.create","project.view"]` |
| 1 · user | user → INACTIVE | `[]` |
| 2 · role | role → INACTIVE | `[]` |
| 3 · link | remove `project.create` (D-8) | `["project.view"]` |
| 4 · permission | `project.view` → INACTIVE | `["project.create"]` |

Gate 4 is the one worth dwelling on. While `project.view` was inactive, its link row was
confirmed **still `ACTIVE`** in the database — so the permission's own status, and nothing else,
caused the exclusion. Without that check, gates 3 and 4 could be collapsing into one another and
the tests would still pass.

## Key Implementation Details

### 1. Existence is checked separately from resolution

A non-existent user is `404`. An existing but inactive one is `200` with `[]`. Conflating them
would let a caller treat "unknown id" as "legitimately denied" — which is exactly the kind of
thing that turns a typo into a silent authorization decision.

### 2. Exact, case-sensitive matching

`project` denies. `PROJECT.CREATE` denies. Permission names are identifiers, and loose matching
in an authorization check is how prefix bugs become privilege escalation. The requested name is
trimmed, and blank is a 400 rather than a deny.

### 3. `DISTINCT`, because a join can duplicate

A role granting the same permission through more than one row would otherwise produce repeats. A
live check counted `project.create` exactly once.

### 4. No caching

A revoked permission takes effect immediately. Nothing in the scope asks for caching, and
staleness in an authorization path is a liability rather than a feature.

Worth stating plainly for the next work item: `authentication-login` will embed permissions in a
JWT, which **does** introduce staleness until the token is reissued. That is D-2's accepted
trade-off, and it belongs to that work item to state — not to this one to pre-empt.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layer | Read side only — query class, no repository | Resolution never mutates; CQRS split |
| Query | One statement, three joins, four gates | An N+1 across links would slow every guarded request |
| Contract | Permission **names** | §5's shape; ids are meaningless to a calling module |
| Unknown user | 404, not `[]` | "No such user" ≠ "user has no permissions" |
| Matching | Exact and case-sensitive | Loose matching in authorization is a privilege-escalation path |
| Caching | None | Staleness in authorization is worse than a query |
| Raw SQL | Accepted over Sequelize `include` | Four independent status predicates across three joins must be auditable at a glance |

## Deviations from Plan

None.

## How to Verify

```bash
cd backend && npm test      # 318 tests

# with a role, two permissions, both linked, and a user holding the role:
curl localhost:3000/user/1/permission
#   {"permissions":["project.create","project.view"]}

curl "localhost:3000/user/1/permission/check?name=project.create"   # allowed true
curl "localhost:3000/user/1/permission/check?name=project.delete"   # allowed false

# each gate, one at a time:
curl -X PATCH localhost:3000/user/1 -d '{"entityStatus":"INACTIVE"}' \
  -H 'Content-Type: application/json' && curl localhost:3000/user/1/permission   # []
curl -X DELETE localhost:3000/role/1/permission/1 \
  && curl localhost:3000/user/1/permission                    # project.create gone
curl -X PATCH localhost:3000/permission/2 -d '{"entityStatus":"INACTIVE"}' \
  -H 'Content-Type: application/json' && curl localhost:3000/user/1/permission   # view gone

curl localhost:3000/user/99/permission                        # 404, not []
```

## Test Coverage

- Tests added: 13; 318 total
- Live checks: 16, including all four gates isolated
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 12/12
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**`route-protection` should not reimplement any of this.** It needs the same resolution, and
duplicating the four gates in a guard is how they drift apart. Either call this query class or
read the JWT claims that `authentication-login` derives from it — the work item already says the
resolution path must be shared rather than reimplemented.

**The raw SQL is not type-checked against the models.** If a column is renamed in a migration,
this query breaks at runtime rather than at compile time. `SchemaContract.spec.ts` pins the
model definitions and the live checks exercise the query; those are the compensating controls.
Worth remembering before renaming a column.

**Next work item**: `authentication-login` (high, validate) — JWT issuing, uniform 401s, and
FR-U7. It depends on this slice for the permission claims.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-007*
