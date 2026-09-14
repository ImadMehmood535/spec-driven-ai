---
run: run-spec-driven-ai-014
work_item: ui-permissions
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-15T02:00:00Z
---

# Implementation Plan: Permission Management Screens

> Checkpoint self-served under the standing instruction.

## Approach

The first of three screens, and the proving ground for the shared kit. Satisfies FR-UI3.

**Built entirely from `components/shared/`.** If this screen needs a new table, form field, or
empty state, the kit's props are wrong and the kit changes — a screen must never fork one. That
is the claim run 012 made, and this run either confirms or refutes it.

## Files to Create

| File | Purpose |
|------|---------|
| `features/permissions/usePermissionQueries.ts` | List and mutation hooks over the API |
| `features/permissions/PermissionForm.tsx` | **One** form, create and edit modes |
| `features/permissions/PermissionFormDialog.tsx` | Dialog wrapper with pending state |
| `features/permissions/PermissionsTable.tsx` | Columns, row actions, filters |
| `features/permissions/PermissionsPage.tsx` | Composition |
| `app/permissions/page.tsx` | Route |
| Four spec files | States, validation, server errors, gating, axe |

## Files to Modify

`app/layout.tsx` — mount the toast provider (`sonner`), which every mutation reports through.

## Technical Details

**Create and edit share one form** (FR-UI13). Two forms that differ only in their submit handler
is the duplication this project keeps forbidding.

**A duplicate name is a 409 whose message names the permission.** `api-error.ts` already infers
the field, so the error lands on the `name` input and the user's input is preserved (FR-UI9).

**Activate/deactivate is a `PATCH` with `entityStatus`**, behind a `ConfirmDialog` whose copy
says what actually changes — deactivation is the only retirement mechanism (D-5), so it carries
the weight a delete dialog normally would.

**No delete control anywhere**, and a test asserts its absence rather than merely not adding it.

**Every mutating control is wrapped in `PermissionGate`** with the names the seed creates:
`permission.create`, `permission.update`. Usability only — the API enforces.

---
*Plan approved at checkpoint. Execution follows.*
