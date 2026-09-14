---
run: run-spec-driven-ai-015
work_item: ui-roles
intent: developer-user-module
generated: 2026-09-15T03:35:00Z
mode: confirm
---

# Implementation Walkthrough: Role Management and Permission Assignment

## Summary

Roles can be listed, filtered, created, edited, and activated/deactivated — and a role's
permissions can be viewed, assigned, and removed. Satisfies FR-UI2 and FR-UI4.

194 tests. The D-8 remove-then-re-add cycle verified against the live API.

## The new work: the assignment view

Role CRUD is the permissions screen again. The interesting part is `RolePermissionsDialog`.

```text
Permissions for Developer Admin
┌──────────────────────┬───────────────────────────┐
│ Assigned             │ Available                 │
│  project.create  ✕   │  [ search permissions ]   │
│  project.view    ✕   │  + project.delete         │
│                      │  + user.create            │
└──────────────────────┴───────────────────────────┘
```

Four decisions inside it:

**Already-assigned permissions are not offered.** That makes the 409 path unreachable through
normal use — offering something that will be rejected is a trap. A 409 is still handled, because
another administrator could assign concurrently.

**Only active permissions are offered.** A deactivated permission grants nothing (FR-AC3), so
offering it would be misleading.

**Search, not a long list.** 18 permissions today, more later. The frontend standards call this
out specifically.

**Two distinct empty messages** on the available side — "no unassigned permissions match that
search" versus "every active permission is already assigned". They mean different things.

## Copy that carries information

**Deactivating a role** says what the table cannot show:

> Users keep the Developer Admin role, but it will grant them no permissions until it is
> reactivated.

FR-AC3 excludes everything reached through an inactive role. Nothing on the roles list hints at
that, so the confirmation has to.

**Removing a permission** reflects D-8 rather than implying erasure:

> project.create will no longer apply to anyone with the Developer Admin role. You can assign it
> again later.

And there is **no separate reactivate control** — re-adding is an ordinary assign, and the
backend reactivates the same row. Run 004's walkthrough asked for exactly this, so that an
implementation detail does not leak into the interface.

## Verified live

Driven through the same endpoints the dialog calls:

```
DELETE /role/1/permission/1   → 200 {"linkStatus":"INACTIVE"}   assigned 18 → 17
POST   /role/1/permission     → 201                              assigned 17 → 18
RolePermission rows           → 18 throughout, never 19
```

The screen's remove-then-re-add path is proven against the real backend, not only mocks.

## Deviations from Plan

**Substitution bit again, in a new way.** Generating the roles page from the permissions page
renamed the **shared** `PermissionGate` to a non-existent `RoleGate`, and its `permission` prop
to `role`.

Run 004 taught that substitution carries wrong semantics; this adds a sharper rule: **it may
rename domain nouns, never imported shared components.** The typecheck caught it immediately,
which is the only reason it was cheap.

Also, `sed` on template literals blanked both branches of the deactivation copy and left invalid
syntax. Repaired with the editor rather than more shell escaping.

## How to Verify

```bash
cd backend && docker compose up -d && npm run migrate && npm run seed && npm run start:dev
cd frontend && npm run dev

# signed in as the seeded admin:
#   /roles                → the seeded Developer Admin role
#   row actions           → Edit, Permissions, Deactivate (no Delete)
#   Permissions           → 18 assigned, none offered as available
#   remove one            → confirmation says it can be assigned again
#   it reappears under Available; assign it back

cd frontend && npm test    # 194 tests
```

## Test Coverage

- Tests added: 22; 194 total
- Live: the D-8 cycle through the dialog's own endpoints
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 14/14
- [x] Tests passing; typecheck, lint, build clean
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**The available list caps at 50.** Fine for 18 permissions with search; a catalogue in the
hundreds would want search to drive server-side paging. The search already goes to the server, so
that change is small.

**Assignment sends one permission per click**, though the API accepts an array. Immediate
feedback, small optimistic surface. Multi-select is a reasonable later addition — the API
supports it already.

**`ui-users` is the last screen, and its conflict handling differs.** Users have **two** unique
fields, so its form cannot blanket-attribute a 409 the way roles and permissions do. The API's
user messages do contain the words "email" and "username", so the generic inference in
`api-error.ts` works there — use it rather than overriding.

**Next work item**: `ui-users` (medium, confirm).

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-015*
