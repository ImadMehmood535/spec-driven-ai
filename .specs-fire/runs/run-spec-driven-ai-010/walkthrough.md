---
run: run-spec-driven-ai-010
work_item: route-protection
intent: developer-user-module
generated: 2026-09-12T21:00:00Z
mode: validate
---

# Implementation Walkthrough: Route Guards

## Summary

The module now enforces its own RBAC on its own endpoints. Every route except login, health, and
Swagger requires a valid JWT, and each management route requires the permission governing it.
Satisfies FR-AC5–FR-AC7 and D-7.

**This completes the backend.** 370 tests pass; the authorization matrix was verified live.

## How it works

```
APP_GUARD  JwtAuthGuard      verifies the bearer token, attaches claims   → 401 on failure
APP_GUARD  PermissionsGuard  reads @RequiresPermission, checks claims     → 403 on failure

@Public()                            skips both      (login, health, docs)
@RequiresPermission('user.create')   requires that name in the claims
neither                              REFUSED         ← default deny
```

Both guards are global. That direction matters: with per-route opt-in, a forgotten decorator
leaves a route **open**; with global-plus-exemptions, a forgotten decorator leaves it **closed**.

## Key Implementation Details

### 1. Default deny is the load-bearing decision

A route declaring neither a permission nor `@Public()` is refused — tested from both directions:
`PermissionsGuard` refuses it even for a caller holding *every* permission, and a scan asserts
every route-bearing controller declares something.

The failure this prevents is the most likely way this module would develop a hole: someone adds
a route, forgets the decorator, and it becomes reachable by any authenticated caller.

### 2. Permission names are cross-checked against the seed

A third test compares every `@RequiresPermission` name against `seed-catalogue.cjs`. A name the
seed does not create would lock the administrator out of that route **with no way to grant it
through the API** — the kind of deadlock that is obvious in hindsight and invisible in review.

### 3. The guards read claims, not the database

Claims come from the shared resolution query at login, so FR-AC3's four gates cannot drift
between what login granted and what enforcement allows. No database round trip per request.

### 4. 401 and 403 mean different things, and stay different

Absent, malformed, and expired tokens are all 401 with one message that reveals nothing about
which. A valid identity missing a permission is 403 and names the permission — useful to an
operator, and not a disclosure, since they already know what they attempted.

### 5. Verified as a matrix, not as individual cases

```
no token                          → 401   (all five route groups)
garbage token / no scheme         → 401
valid token, has permission       → 200
valid token, lacks permission     → 403   naming the permission
seeded admin (all 18)             → 200   every route, including writes
/health, /docs                    → 200   public
```

## The staleness trade-off — read this before depending on the module

Permissions are read from the token. **A revocation does not take effect until the token is
reissued** (default 1h).

That is D-2's design, and the alternative — resolving on every request — would contradict it and
put a query on every call. But the consequences should be explicit:

- Removing a permission from a role, deactivating a role, or deactivating a user does **not**
  immediately invalidate an already-issued token.
- FR-U7 prevents a deactivated user from *logging in*; it does not stop a token issued before
  deactivation.
- Anything needing immediacy calls `GET /user/:id/permission`, which is uncached precisely so it
  can serve that purpose.
- `JWT_EXPIRES_IN` narrows the window.

`permission-resolution`'s deliberate lack of caching and this decision are two halves of the
same trade-off.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Guard registration | Global, with `@Public()` exemptions | A forgotten decorator must fail closed |
| Undeclared route | **Refused** | An omission must not become an open route |
| Permission source | JWT claims | D-2; avoids a query per request. Staleness accepted and stated |
| 401 vs 403 | Distinct | Different client actions: re-authenticate vs request access |
| Public routes | login, health, Swagger only | A token cannot exist at login; the others are not access-controlled |
| `/user/:id/permission` | Requires `user.view` | It exposes user data; avoids inventing a permission the scope does not imply |

## Deviations from Plan

None in substance. Three low-severity fixes are in `review-report.md`, including one where my own
verification was wrong rather than the code: a substring search matched `role-permission.view`
when I meant `permission.view`, so the "allowed" case initially went unexercised.

## How to Verify

```bash
cd backend && npm test     # 370 tests

npm run migrate && npm run seed && npm run start:dev

curl localhost:3000/permission                     # 401
curl localhost:3000/health                         # 200

TOKEN=$(curl -s -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@developer.local","password":"<SEED_ADMIN_PASSWORD>"}' \
  | sed 's/.*"accessToken":"//; s/".*//')

curl -H "Authorization: Bearer $TOKEN" localhost:3000/permission    # 200
curl -H "Authorization: Bearer not.a.token" localhost:3000/permission  # 401
```

## Test Coverage

- Tests added: 23; 370 total
- Live checks: 20, the full authorization matrix
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 11/11
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**The backend is complete.** All ten backend work items are done: scaffold, migrations, four
entity slices, resolution, login, seeds, and guards.

**For the frontend**: FR-UI6 hides controls the user lacks permission for, and the claims in the
token are what it should read. That is **usability only** — enforcement is here. A hidden button
is not a security control, and the UI must never be described as one.

**Every management route now needs a token**, so `ui-auth` is a prerequisite for the screens
being usable at all — the three screen items can be built against the API, but nothing works
in the browser until login exists.

**Next work item**: `ui-scaffold` (medium, confirm) — the Next.js admin UI, in `frontend/`, fully
independent of this project per the constitution's *Backend / Frontend Separation*.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-010*
