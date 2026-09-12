---
id: ui-users
title: User Management Screens
intent: developer-user-module
complexity: medium
mode: validate
status: pending
depends_on: [ui-shared-components, user-crud]
created: 2026-09-12T12:38:02Z
---

# Work Item: User Management Screens

## Description

Admin screens for users: list, view, create, update, activate/deactivate, and assign a role.
Satisfies FR-UI1.

## Acceptance Criteria

- [ ] List screen on the shared **DataTable** with filter (name/email/username), sort, pagination, column visibility, row actions (FR-UI8)
- [ ] List can be filtered by role and by status
- [ ] Create form collects user information and an initial password, validated with Zod (FR-UI9)
- [ ] Password field never echoes the value into a URL, log, or toast (NFR-3)
- [ ] Create and update share one form component, with the password field present only where it applies (FR-UI13)
- [ ] Duplicate email or username 409 maps onto the correct field, input preserved (FR-UI9)
- [ ] **Assign role** control showing the single current role, making replacement explicit rather than additive (FR-UI1, FR-U5)
- [ ] Assigning a role when one is already set reads as "change role", matching the one-role-per-user model (§6)
- [ ] A user with no role is shown as such, and the UI does not imply they have permissions (FR-AC4)
- [ ] Activate/deactivate behind a **ConfirmDialog** whose copy notes the user will be unable to log in (FR-U7)
- [ ] Success and failure toasts on every mutation (FR-UI7)
- [ ] Loading, empty, and error states from the shared kit (FR-UI7)
- [ ] Permission gating on every mutating control (FR-UI6)
- [ ] **No user delete action** (D-5)
- [ ] Responsive, keyboard-operable, correct in dark mode (FR-UI10, UI11, UI12)
- [ ] Tests: list states and filters, create validation, duplicate email/username mapped to fields, role assignment replaces rather than accumulates, deactivate confirmation copy, toasts, permission gating, axe — plus a test asserting no password value appears in any rendered output after submit

## Technical Notes

The one-role-per-user constraint has to be visible in the UI, or operators will expect
multi-select and file it as a bug. Present it as a single-value control and label the action
"change role" when a role is already assigned.

Whether an administrator can change another user's password depends on what `user-crud`
decided about password updates. Do not add a password-change control here if the backend has no
route for it — that would be scope creep (§10).

Deactivation is the only retirement mechanism (D-5), so the deactivate confirmation carries
weight that a delete dialog normally would. Its copy should be specific: the user will no longer
be able to log in.

## Dependencies

- ui-shared-components
- user-crud
