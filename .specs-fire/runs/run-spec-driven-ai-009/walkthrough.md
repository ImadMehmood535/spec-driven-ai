---
run: run-spec-driven-ai-009
work_item: seed-bootstrap
intent: developer-user-module
generated: 2026-09-12T20:20:00Z
mode: validate
---

# Implementation Walkthrough: Seeds

## Summary

The system is now usable from a cold start. Four idempotent seeders create the permission
catalogue, an administrator role holding **every** permission, and the first administrator from
environment configuration. Satisfies FR-S1–FR-S7 and D-6/D-7.

347 tests pass. The seeded administrator logs in and holds all 18 permissions — verified through
the real resolution query.

## What §2 needed, and what this provides

`docs/scope.md` §2 says "authorized administrators" perform these operations. Once
`route-protection` lands, every route requires a permission — so without a pre-existing
administrator there would be nobody able to create one. That is the bootstrap problem D-6
resolves, and this run closes it.

## The seeders

```text
src/config/seed-catalogue.cjs          every permission name, in one place
src/seeders/
  …200000-seed-permissions.cjs         upsert by name; reactivate if inactive
  …200100-seed-admin-role.cjs          upsert by name
  …200200-seed-admin-links.cjs         link the role to EVERY permission (computed)
  …200300-seed-first-admin.cjs         upsert by email; NEVER touches an existing password
```

Four rather than one, so a failure is attributable and each is independently re-runnable.

## Key Implementation Details

### 1. No default credentials, and I checked by running without them

```
$ env -u SEED_ADMIN_EMAIL -u SEED_ADMIN_USERNAME -u SEED_ADMIN_PASSWORD npm run seed
Seed failed: SEED_ADMIN_EMAIL, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD must be set.
The first administrator has no default credentials by design.
```

A default admin password is a backdoor in every environment that forgot to override it. The only
way to be sure one does not exist is to try.

### 2. A re-run cannot take over a live account

The existing-user branch updates the role and status and **explicitly leaves the password
alone**. Verified by capturing the hash, running the seed twice more, and comparing:

```
run 1 → run 3:  perms 18 | roles 1 | links 18 | users 1   (unchanged)
admin password hash: byte-identical
```

Without that, any routine deploy would reset the administrator's password to whatever the deploy
environment happened to hold.

### 3. FR-S7 is verified through resolution, not the insert list

Asking a seeder whether it inserted what it meant to insert proves nothing. So the check goes
through the same resolution query route guards will use:

```
resolved for the admin: 18    permissions in the table: 18
```

### 4. Links are computed, which is why a new permission is picked up

A hard-coded grant list goes stale the moment someone adds a permission — the seed keeps
reporting success while the administrator quietly lacks access to new routes. The links seeder
reads the permission table at run time instead:

```
add a 19th permission via the API, re-run the seed
→ admin holds 19, including the new one
```

### 5. The catalogue has no `*.activate` permission

Activation is a status change on the update route. A separate `permission.activate` would
describe an API that does not exist, so `update` covers it — and a test asserts no permission
name contains "activate", so nobody adds one by reflex.

### 6. The catalogue lives outside `src/seeders/`

`sequelize-cli` treats **every** file in the seeders directory as a seeder. A shared module there
would be executed as one and fail for having no `up`. It sits in `src/config/` instead — caught
in review, before the first run.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Idempotency key | Natural keys (name, email) | Ids differ between environments; names do not |
| Admin credentials | Environment only, no defaults | A default admin password is a backdoor |
| Existing admin | Password never reset | A deploy must not be able to take over an account |
| Admin grants | Computed from the table at run time | A hard-coded list goes stale and locks the admin out |
| Seeder count | Four, ordered | Attributable failures; independently re-runnable |
| Catalogue location | `src/config/` | The CLI would execute it as a seeder otherwise |

## Deviations from Plan

None in substance; the two review findings are listed above.

## How to Verify

```bash
cd backend

# no credentials → refuses
env -u SEED_ADMIN_EMAIL -u SEED_ADMIN_USERNAME -u SEED_ADMIN_PASSWORD npm run seed

# with credentials in .env
npm run migrate && npm run seed && npm run seed   # twice: nothing changes

docker exec developer-user-db psql -U postgres -d developer_user -c \
  'select (select count(*) from "Permission") perms, (select count(*) from "RolePermission") links;'
# 18 | 18

curl -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"admin@developer.local","password":"<your SEED_ADMIN_PASSWORD>"}'
curl localhost:3000/user/1/permission        # all 18
```

## Test Coverage

- Tests added: 8 (catalogue); 347 total
- Live checks: 11, including idempotency across three runs and resolution-based FR-S7
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 13/13
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**Seeder behaviour is verified live, not by unit test.** They are `.cjs` run by
`sequelize-cli` with node, outside the TS build — so a unit test would have to reimplement the
CLI to exercise them. The catalogue, which is requireable, is under test; the seeders are proven
by running them.

**`route-protection` should require the names in `seed-catalogue.cjs`** and nothing else. If a
guard requires a name the catalogue does not seed, the administrator is locked out of that route
with no way to grant it through the API. The catalogue test's route-coverage assertion is the
guard against that drift.

**`seed:undo` is environment-dependent.** The admin seeder's `down` reads `SEED_ADMIN_EMAIL` and
no-ops when it is unset, rather than guessing which user to delete.

**Next work item**: `route-protection` (high, validate) — the last backend item. It applies this
module's own RBAC to its own endpoints, and the permission names it requires all exist now.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-009*
