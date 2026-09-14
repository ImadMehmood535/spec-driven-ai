---
run: run-spec-driven-ai-012
work_item: ui-shared-components
intent: developer-user-module
generated: 2026-09-15T00:50:00Z
mode: confirm
---

# Implementation Walkthrough: Shared UI Component Kit

## Summary

The kit every screen is built from. Built **before** the screens, so no screen has a reason to
hand-roll its own table, form field, or empty state — that is how FR-UI13 gets enforced rather
than hoped for.

98 tests. Typecheck, lint and production build clean.

## What landed

```text
src/components/
├── ui/          button · input · label · badge · skeleton · table
│                dialog · dropdown-menu            (Radix-backed)
└── shared/
    ├── DataTable        filter · sort · paginate · column visibility · row actions
    ├── PageHeader       title · description · actions slot
    ├── FormField        label + control + description + error, properly associated
    ├── StatusBadge      ACTIVE/INACTIVE — never colour alone
    ├── ConfirmDialog    consequential actions, pending state
    ├── EmptyState       what is absent + how to fill it
    ├── ErrorState       what failed + retry
    ├── TableSkeleton    shaped like the table
    └── PermissionGate   FR-UI6 gating
src/hooks/usePermissions.tsx
```

## Key Implementation Details

### 1. The DataTable's props were designed against all three screens first

Permissions, roles, and users each need something slightly different — a status filter, a create
action in the empty state, a role filter, more columns. All three are expressible today, and the
`toolbar` slot is what absorbs per-screen filters without the table knowing about roles or
statuses.

If a screen later cannot express something, **the kit changes** — a screen must never fork it.

### 2. Everything is server-side, because the API paginates

Filtering, sorting and pagination are controlled props. The table holds no data state except
column visibility.

That is not a stylistic choice: a table that sorted its own rows would sort **one page**, not the
set. It would look correct and be wrong.

### 3. "No matches" is not "nothing exists yet"

Telling someone to "create your first permission" when they have typed a filter that matches
nothing is misleading. `isFiltered` switches the copy and drops the create action.

### 4. State precedence is asserted, not assumed

Error → loading → empty → table. A test supplies an error alongside empty data and expects the
error, so the order cannot drift.

### 5. The form error is attached to its field

`aria-describedby` plus `role="alert"`, and the control gets `aria-invalid`. Red text floating
near a field is invisible to a screen reader; this is what makes FR-UI9 and FR-UI11 real rather
than visual.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Table state | Controlled, server-side | The API paginates; local sorting would sort one page |
| Per-screen filters | A `toolbar` slot | Keeps the table ignorant of domain concepts |
| Empty copy | Differs when filtered | "Create your first" is wrong when a filter is active |
| Status display | Always the word | Colour-only fails for colour-blind users and high contrast |
| `ConfirmDialog` | Takes `pending`, owns no mutation | Stays dumb and reusable |
| `PermissionGate` | Defaults to hidden | Avoids flashing controls before claims load |

## Deviations from Plan

**A dependency mistake.** `@tanstack/react-table` installed at v9 while the stack documents v8 —
`getCoreRowModel` renamed, `VisibilityState` unexported, generic constraint changed. Pinned to
`^8`. This is the second time I have taken `latest` instead of the documented line
(`@nestjs/jwt` in run 008 was the first).

**A change I reverted.** I wrapped `userEvent.setup` with `delay: null`, believing its simulated
pointer delay was why the menu test took 7.5s. Measured: 7.4s. The theory was wrong, so the
wrapper came back out rather than staying with a comment claiming a benefit it does not deliver.
The real cause is Radix under jsdom, and the raised timeout is the honest fix.

## How to Verify

```bash
cd frontend
npm test            # 98 tests
npm run typecheck   # clean
npm run lint        # clean
npm run build       # production build
```

## Test Coverage

- Tests added: 62; 98 total
- Every component: its states, keyboard interaction, and axe **in both themes**
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 16/16
- [x] Tests passing; typecheck, lint, build clean
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**The three screen items should import from this kit and add nothing structural.** If one needs
a behaviour the DataTable cannot express, change the DataTable — a second table is the failure
this item exists to prevent.

**Overlay interaction tests are slow** (~7s for one menu open) because of Radix under jsdom, not
because the tests are written badly. Worth knowing before adding many more.

**Column visibility labels columns by `id`.** Readable for these screens; a column id like
`roleName` would display verbatim. The fix, if needed, is a `meta.label` on the column
definition.

**Next work item**: `ui-auth` (high, validate) — login, session, and the token storage decision
(D-10). It populates `PermissionsProvider`, which every gated control here depends on.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-012*
