---
run: run-spec-driven-ai-014
work_item: ui-permissions
intent: developer-user-module
generated: 2026-09-15T02:35:00Z
mode: confirm
---

# Implementation Walkthrough: Permission Management Screens

## Summary

The first of three screens. Administrators can list, filter, create, edit, and
activate/deactivate permissions. Satisfies FR-UI3.

172 tests. Served against a live API holding the seeded 18 permissions.

## The question this run answered

Run 012 claimed the shared kit was genuinely reusable and that no screen would need to fork it.
This screen is the test.

**It held.** Built entirely from `DataTable`, `PageHeader`, `FormField`, `StatusBadge`,
`ConfirmDialog`, `EmptyState`, `ErrorState`, `TableSkeleton`, and `PermissionGate` — nothing
forked, and the kit needed no changes. The `toolbar` slot was not even required; the default
search covered it.

## Key Implementation Details

### 1. The one defect found was a product gap, not a test bug

A test asserting that a duplicate-name conflict lands on the `name` input **failed**.

The cause was real: the API says `Permission "project.create" already exists.` — which never
contains the word "name". The generic inference in `api-error.ts` matches on prose, so it
returned `undefined` and the error rendered detached from the input a user would fix.

FR-UI9 requires server field errors to map back onto the right field, so the fix went into the
**product**: a conflict on this form can only concern the name, because that is its only unique
field. The form attributes it; the generic inference remains as a fallback.

`api-error.ts`'s own review note in run 011 predicted this fragility. The pattern that emerged —
generic inference by default, the form overriding when it knows its domain — is what the roles
and users screens should follow.

### 2. Create and edit are one form

Two forms differing only in a submit handler is the duplication this project keeps forbidding. A
test asserts both modes render from the same component.

### 3. Field errors and toasts do different jobs

A conflict on the name shows **on the input**, where it can be fixed. A failure with no
attributable field becomes a toast. A test asserts the conflict path does not merely toast and
leave the user hunting.

### 4. The deactivation dialog is honest about the blast radius

> "project.create will stop granting access immediately, for every role that holds it."

D-5 makes deactivation the only retirement mechanism, so this dialog carries the weight a delete
dialog normally would — and it names the consequence rather than asking "are you sure?".

### 5. No delete, asserted rather than merely absent

The test enumerates the row menu and expects exactly `Edit` and `Deactivate`. An omission can be
re-added by accident; a test cannot.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Conflict attribution | The form maps 409 to `name` | It is the only unique field; generic prose inference cannot know that |
| Create/edit | One form, two modes | FR-UI13 |
| Error presentation | Field error where attributable, toast otherwise | An error the user can fix belongs beside the input |
| Sorting | Disabled | The API accepts no sort parameter; a control that did nothing would be worse |
| Cache | Invalidate on every mutation | The table reflects the server rather than a local guess |

## Deviations from Plan

None in substance. The conflict-attribution fix was not in the plan because the gap only appeared
when the test exercised it.

## How to Verify

```bash
cd backend && docker compose up -d && npm run migrate && npm run seed && npm run start:dev
cd frontend && npm run dev     # http://localhost:3100

# sign in as admin@developer.local, then:
#   /permissions  → 18 seeded permissions
#   filter, create a new one, try creating it twice → error on the name field
#   row actions → Edit, Deactivate (no Delete)
#   deactivate → confirmation naming the consequence, then a toast

cd frontend && npm test    # 172 tests
```

## Test Coverage

- Tests added: 30; 172 total
- Live: both apps running; the screen served and leaked no data unauthenticated
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 11/11
- [x] Tests passing; typecheck, lint, build clean
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**A stale server cost me a wrong first reading.** `/permissions` returned 404 while an old
`next start` held port 3100 — the new one failed with `EADDRINUSE` and the previous build kept
answering. The route was in the build the whole time. Kill listeners on 3100 before concluding a
route is broken.

**Follow the conflict-attribution pattern in the next two screens.** Roles have a unique `name`;
users have unique `email` **and** `username`, so that form cannot blanket-attribute a 409 — it
will need the message to disambiguate, and the API's user messages *do* contain the words "email"
and "username", so the generic inference works there.

**Sorting is off because the API offers none.** If it gains a sort parameter, `enableSorting`
plus an `onSortingChange` handler are the only changes.

**Next work item**: `ui-roles` (medium, confirm) — includes the permission-assignment view, the
richest interaction in the module.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-014*
