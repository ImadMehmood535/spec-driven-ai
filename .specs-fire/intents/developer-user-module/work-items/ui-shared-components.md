---
id: ui-shared-components
title: Shared UI Component Kit
intent: developer-user-module
complexity: medium
mode: confirm
status: pending
depends_on: [ui-scaffold]
created: 2026-09-12T12:38:02Z
---

# Work Item: Shared UI Component Kit

## Description

The reusable components every management screen is built from. This work item exists to satisfy
FR-UI13 — "reusability not complexity" — by building the kit *before* the screens, so no screen
has a reason to hand-roll its own table, form field, or empty state.

Satisfies FR-UI7, FR-UI8, FR-UI9, and FR-UI11 at the component level.

## Acceptance Criteria

- [ ] **DataTable** on TanStack Table supporting filtering, sorting, pagination, column visibility, and row actions (FR-UI8)
- [ ] DataTable pagination is server-side, wired to the API's `page`/`size` contract and `PaginationMeta`
- [ ] DataTable scrolls inside its own container on narrow viewports; the page body never scrolls horizontally (FR-UI10)
- [ ] **PageHeader** with title, description, and an actions slot
- [ ] **FormField** wrapper pairing label, control, description, and error — used by every form (FR-UI9)
- [ ] **StatusBadge** rendering `ACTIVE`/`INACTIVE`, not colour-only (accessibility)
- [ ] **ConfirmDialog** for consequential actions, with a distinct confirm label per use (FR-UI7)
- [ ] **EmptyState** stating what is absent and the action that fills it (FR-UI7)
- [ ] **Skeletons** matching the real layout of the table and form — never a bare spinner for initial load (FR-UI7)
- [ ] **ErrorState** stating what failed and offering retry (FR-UI7)
- [ ] A `usePermissions` hook reading the token's permission claims, plus a gate component for permission-driven rendering (FR-UI6)
- [ ] Every component is keyboard-operable with a visible focus state (FR-UI11)
- [ ] Dialogs and sheets trap focus and restore it on close (FR-UI11)
- [ ] Variants come from `class-variance-authority`, not conditional class strings
- [ ] Every component correct in light and dark (FR-UI12)
- [ ] Tests per component covering its states, keyboard interaction, and a `jest-axe` assertion (testing standards)

## Technical Notes

This is the highest-leverage work item on the frontend: three screens depend on it, and if the
DataTable is not genuinely reusable, each screen will grow its own. Design its props against
all three use cases — users, roles, permissions — before building it.

Mutation feedback belongs to the calling screen (toast on success, per FR-UI7) but the
confirmation and pending-state mechanics belong here, so screens cannot diverge.

`usePermissions` is usability only. It must never be described or relied on as security —
FR-AC5–AC7 hold that boundary on the server.

## Dependencies

- ui-scaffold
