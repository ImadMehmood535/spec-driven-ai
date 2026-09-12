---
id: ui-permissions
title: Permission Management Screens
intent: developer-user-module
complexity: medium
mode: validate
status: pending
depends_on: [ui-shared-components, permission-crud]
created: 2026-09-12T12:38:02Z
---

# Work Item: Permission Management Screens

## Description

Admin screens for permissions: list, view, create, update, activate/deactivate. Satisfies
FR-UI3. Built entirely from the shared kit — no new table, form field, or empty state.

## Acceptance Criteria

- [ ] List screen using the shared **DataTable**: filter by name, sort, paginate, toggle columns, row actions (FR-UI8)
- [ ] Status shown via the shared **StatusBadge**
- [ ] Create via dialog (or sheet on mobile), validated with a Zod schema (FR-UI9)
- [ ] Update reuses the same form component as create — one form, two modes, not two forms (FR-UI13)
- [ ] Activate/deactivate from row actions, behind a **ConfirmDialog** (FR-UI7)
- [ ] Server-side field errors — a duplicate name 409 — map back onto the `name` field, and input is preserved (FR-UI9)
- [ ] Success toast on create, update, and status change; failure toast with a useful message (FR-UI7)
- [ ] Loading uses the shared **skeleton**; empty uses **EmptyState**; failure uses **ErrorState** with retry (FR-UI7)
- [ ] Controls the user lacks permission for are hidden or disabled via the permission gate (FR-UI6)
- [ ] **No delete action anywhere in the UI** (D-5)
- [ ] Responsive, keyboard-operable, correct in dark mode (FR-UI10, UI11, UI12)
- [ ] Tests: each state, validation, duplicate-name server error mapped to the field, confirmation before deactivate, toast on success, permission gating, and an axe assertion

## Technical Notes

Permissions are the simplest of the three entities, so this screen is the proving ground for
the shared kit. If anything here needs a bespoke component, the kit's props are wrong — fix the
kit rather than forking a component (FR-UI13).

Permission names are operator-facing identifiers like `project.create`; display them in a way
that stays readable when the list grows, and make the name filter the primary affordance.

## Dependencies

- ui-shared-components
- permission-crud
