---
run: run-spec-driven-ai-006
work_item: user-crud
intent: developer-user-module
generated: 2026-09-12T18:35:00Z
mode: validate
---

# Implementation Walkthrough: User Management Slice

## Summary

Users can be created, viewed, listed, updated, activated/deactivated, assigned a role, and have
their password changed by an administrator. Satisfies FR-U1–FR-U5 and D-9.

This is the first slice that stores credentials, and the design is arranged so a password has
nowhere to leak: hashed before the aggregate exists, absent from the read-model type, redacted
in logs, and missing from every response class.

305 tests pass. 14 checks against a real database.

## How a password moves through the system

```text
POST /user { password: "a-real-password" }
  └─ UserController                     never sees the hash
       └─ CreateUserCommandHandler
            ├─ length check              rejected requests never pay for a cost-12 hash
            ├─ role exists?              404 before any hashing
            ├─ email/username unique?    409 before any hashing
            ├─ hasher.hash(plaintext)    bcrypt, cost 12  ─────────┐
            ├─ User.create({ passwordHash })                        │ plaintext ends here
            └─ repository.save(user)     column: $2b$12$…          │
                 └─ CreateUserResponse.fromDomain(saved)            │
                      no password field of any kind ────────────────┘

Request logger:  body → redact() → {"password":"[REDACTED]"}
```

The plaintext exists only inside the handler, for the duration of one call. No domain object,
read model, response, or log line can hold it.

## Key Implementation Details

### 1. The read model has no `passwordHash` field at all

Not excluded at serialisation — **absent from the type**. `UserQueries` also selects an explicit
attribute list rather than using `attributes: { exclude: [...] }`, so a column added later
cannot leak by default. Exclusion lists fail open; allow-lists fail closed.

### 2. The aggregate's only password write path is named for the hash

`changePasswordHash`, never `changePassword`. A test enumerates the prototype's property
descriptors and asserts that is the only password-related *method* — so there is nothing a
caller could hand a plaintext to by mistake.

That test initially failed because it also matched the `passwordHash` **getter**, which the
repository legitimately needs to persist the value. Tightening it to descriptors made it assert
what was actually intended.

### 3. Redaction proven twice over

Two HTTP tests spy on stdout across the create and password-change routes and assert the
plaintext is absent while `[REDACTED]` is present. Then live, after exercising both routes with
real passwords: **0 occurrences of the plaintexts in the app log, 4 of `[REDACTED]`**.

The redaction utility shipped in run 001, before any credential route existed. This is the run
that proves it was worth doing then.

### 4. Role assignment replaces — verified in the database

§6 allows one role per user. `roleId` is a scalar column and `assignRole` overwrites. Live, the
column went `1 → 2 → null` across two calls. A test also asserts the value is never an array,
so a future multi-role change has to be deliberate.

### 5. Password change is its own route

`PATCH /user/:id/password`, not a field on the general update. A credential arriving in a
general-purpose body is an unexpected credential in an unexpected place. A test sends a stray
`password` in a normal PATCH and asserts it cannot reach the domain.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where hashing happens | Application layer, before the aggregate | Async work, and it keeps plaintext off every domain object |
| Read model | No `passwordHash` field; explicit attribute allow-list | Absent from the type beats stripped at serialisation; allow-lists fail closed |
| Aggregate write path | `changePasswordHash` | Cannot be handed a plaintext without reading wrong |
| Check order | length → role → uniqueness → hash | A rejected request never pays for cost 12 |
| Email | Lowercased and trimmed | Case-insensitive in practice; uniqueness must match |
| Password minimum | 8 characters | The scope states no policy; weakest defensible default, flagged in the review |

## Deviations from Plan

None in substance. Three small fixes came out of the review, all listed in `review-report.md`.

## Dependencies Added

| Package | Why |
|---------|-----|
| `bcrypt` | Password hashing at cost 12 |
| `@types/bcrypt` | Types |

## How to Verify

```bash
cd backend && npm test     # 305 tests

curl -X POST localhost:3000/user -H 'Content-Type: application/json' \
  -d '{"email":"Ahmed@Example.COM","username":"ahmed","firstName":"Ahmed",
       "lastName":"Khan","password":"a-real-password","roleId":1}'   # 201

docker exec developer-user-db psql -U postgres -d developer_user \
  -c 'select substring("passwordHash",1,7) from "User";'            # $2b$12$

curl localhost:3000/user/1 | grep password                          # no match
curl -X PATCH localhost:3000/user/1/role -H 'Content-Type: application/json' \
  -d '{"roleId":2}'                                                 # replaces
curl -X DELETE localhost:3000/user/1                                # 404 (D-5)
```

## Test Coverage

- Tests added: 71; 305 total
- Live checks: 14, including the hash column and log inspection
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 19/19
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**`authentication-login` inherits three things from here.** `IPasswordHasher.verify` already
exists and is tested. FR-U7 (a deactivated user cannot authenticate) is *not* enforced in this
slice — it only records status, and `User.isActive` is there for login to use. And the uniform
401 requirement means login must not reveal whether an account exists, so it should look up by
email *and* username without branching on which failed.

**Password policy is thinner than it looks.** 8 characters is my default, not the scope's. No
complexity rules, no rotation, no history — all absent from `docs/scope.md` and therefore out of
scope until stated.

**Next work item**: `permission-resolution` (high, validate) — the capability the module exists
for, and the one where all four `entityStatus` gates in FR-AC3 must each be tested separately.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-006*
