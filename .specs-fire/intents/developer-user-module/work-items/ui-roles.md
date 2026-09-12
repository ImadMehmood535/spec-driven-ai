---
id: ui-roles
title: Role Management and Permission Assignment Screens
intent: developer-user-module
complexity: medium
mode: confirm
status: pending
depends_on: [ui-shared-components, role-permission-assignment]
created: 2026-09-12T12:38:02Z
---

# Work Item: Role Management and Permission Assignment Screens

## Description

Admin screens for roles — list, view, create, update, activate/deactivate — plus the screen
where permissions are attached to and removed from a role. Satisfies FR-UI2 and FR-UI4.

## Acceptance Criteria

- [ ] List screen on the shared **DataTable** with filter, sort, pagination, column visibility, row actions (FR-UI8)
- [ ] Create and update share one form component with a Zod schema (FR-UI9, FR-UI13)
- [ ] Activate/deactivate behind a **ConfirmDialog** (FR-UI7)
- [ ] Duplicate role name 409 maps onto the `name` field with input preserved (FR-UI9)
- [ ] Role detail shows the permissions currently assigned to that role (FR-UI4, FR-RP3)
- [ ] Permissions can be **assigned** to a role, several at once (FR-UI4, FR-RP1)
- [ ] Assignment uses a **command menu** for searching the permission list rather than a long unfiltered select (frontend standards)
- [ ] Permissions can be **removed** from a role, behind a confirmation whose copy reflects deactivation rather than erasure (FR-UI4, FR-RP2, **D-8**)
- [ ] Re-adding a previously removed permission works as an ordinary assign — no separate reactivate control (D-8)
- [ ] Already-assigned permissions are not offered again, and a 409 is handled gracefully if it still occurs (FR-RP4)
- [ ] Success and failure toasts on assignment and removal (FR-UI7)
- [ ] Loading, empty, and error states on both the list and the assignment view (FR-UI7)
- [ ] Permission gating on every mutating control (FR-UI6)
- [ ] **No role delete action** (D-5)
- [ ] Responsive, keyboard-operable, correct in dark mode — the command menu included (FR-UI10, UI11, UI12)
- [ ] Tests: list states, form validation, assign one and several, remove with confirmation, already-assigned exclusion, toasts, permission gating, command-menu keyboard navigation, axe

## Technical Notes

This is the richest interaction in the module. The assignment view is where a naive
implementation duplicates table logic — reuse the shared DataTable, or a deliberate list
component added to the kit, rather than a one-off (FR-UI13).

Deactivating a role has a non-obvious consequence for operators: users keep the role but
resolve to no permissions from it (FR-AC3). The confirmation copy should say so plainly, since
the effect is invisible on this screen.

Removal **deactivates** the link (D-8); it does not delete it. Two things follow for this
screen: the confirmation copy should say the permission will no longer apply rather than
implying erasure, and re-adding a previously removed permission is an ordinary assign from the
operator's side — the backend reactivates the existing row. Do not build a separate
"reactivate" affordance.

## Dependencies

- ui-shared-components
- role-permission-assignment
