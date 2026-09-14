---
run: run-spec-driven-ai-016
work_item: ui-users
intent: developer-user-module
generated: 2026-09-15T04:35:00Z
mode: confirm
---

# Implementation Walkthrough: User Management Screens

## Summary

The last screen. Users can be listed, filtered, created, edited, given a role, have their
password changed, and be activated or deactivated. Satisfies FR-UI1.

228 tests. **Every UI requirement in the brief is now implemented.**

## What this screen has that the other two did not

### 1. Credentials

The password is collected on create, submitted, and **never rendered anywhere**. Two tests assert
`container.textContent` does not contain the value after submit — on create and on change. Toasts
name the user, never the credential.

An **edit carries no password at all** — the key is absent from the submission, asserted with
`expect.not.objectContaining`. A credential must not travel in a general-purpose body; changing
one is its own dialog (D-9), matching the API's own separation.

The change-password dialog asks for **no current password**, because this is an administrator
acting on someone else's account rather than a self-service reset.

### 2. Two unique fields, so no blanket attribution

Roles and permissions map any 409 to `name` because each has one unique field. This form must
not: a conflict may concern `email` **or** `username`.

The API names which one — `A user with that email already exists.` — so the generic inference in
`api-error.ts` works here and is used unchanged. Two tests assert each conflict lands on its own
field and leaves the other valid.

That completes a pattern the last three runs built:

| Unique fields | Who attributes the conflict |
|---|---|
| One (permissions, roles) | The form, because it can only mean one thing |
| Several (users) | The API names it; generic inference suffices |

Run 015's walkthrough predicted this exactly, which is why it cost nothing here.

### 3. One role per user, visible in the interface

§6 allows a single role. The interface says so rather than relying on the backend to refuse:

- The action reads **"Assign role"** when none is set and **"Change role"** when one is
- The dialog states that choosing another **replaces** the current one
- The current role is marked and disabled
- A user with no role reads **"No role"**, not an empty cell — an empty cell reads as missing
  data, when the real meaning is FR-AC4: they hold nothing

A multi-select would have implied a capability the module excludes.

## Live verification

```
GET   /user                        → 1 user, roleName "Developer Admin"
GET   /user                        → 0 occurrences of "passwordHash"
PATCH /user/1/role {"roleId":1}    → 200
PATCH /user/1/role {"roleId":null} → {"userId":1,"roleId":null}    cleared
PATCH /user/1/role {"roleId":1}    → 200                           restored
```

Role assignment is a scalar throughout — never an array.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Conflict attribution | Rely on the API's field naming | Two unique fields; the form cannot guess, and the API already says which |
| Password on edit | Absent entirely | A credential must not ride in a general-purpose body (D-9) |
| Password change | Its own dialog, no current-password field | An administrator action, not a self-service reset |
| Role control | Single-value, with replacement stated | §6 — a multi-select would imply otherwise |
| No role | Rendered as "No role" | An empty cell reads as missing data, not as FR-AC4 |
| Creation | Always sends `roleId: null` | Two decisions in one form is worse than two steps |

## Deviations from Plan

None. **Built by hand rather than generated** — the substitution defects of runs 004 and 015 did
not recur, because this screen has no analogue in the other two.

## How to Verify

```bash
cd backend && docker compose up -d && npm run migrate && npm run seed && npm run start:dev
cd frontend && npm run dev

# signed in as the seeded admin:
#   /users                → the seeded administrator, with their role
#   row actions           → Edit, Change role, Change password, Deactivate (no Delete)
#   change role           → current one marked; choosing another replaces it
#   remove role           → reads "No role"
#   deactivate            → "will no longer be able to sign in"

cd frontend && npm test    # 228 tests
```

## Test Coverage

- Tests added: 34; 228 total
- Live: role replacement and the absence of `passwordHash` in the read model
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 15/15
- [x] Tests passing; typecheck, lint, build clean
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**The list has no role or status filter**, though the API, the hook, and the DataTable's
`toolbar` slot all support one. `docs/scope.md` asks only that users be viewable, and I did not
want to invent filters it never called for. Adding one is a small change if you want it.

**Creation does not assign a role.** A role is given afterwards through its own dialog. The API
accepts `roleId` at creation, so combining them is possible — I kept the decisions separate.

**Next work item**: `e2e-critical-flows` (medium, confirm) — the last item. It drives login and a
full management flow through Playwright against both running projects, and verifies the FR-AC3
deactivation path end to end, which is the assertion that crosses every layer.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-016*
