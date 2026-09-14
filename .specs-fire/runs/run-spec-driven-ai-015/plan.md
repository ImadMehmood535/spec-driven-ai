---
run: run-spec-driven-ai-015
work_item: ui-roles
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-15T03:00:00Z
---

# Implementation Plan: Role Management and Permission Assignment Screens

> Checkpoint self-served under the standing instruction.

## Approach

Role CRUD follows the permissions screen exactly — same kit, same patterns. The new work is the
**permission-assignment view** (FR-UI4), the richest interaction in the module.

## Files to Create

| File | Purpose |
|------|---------|
| `features/roles/types.ts`, `useRoleQueries.ts` | List/create/update, plus role-permission hooks |
| `features/roles/RoleForm.tsx` | One form, create and edit |
| `features/roles/RolesPage.tsx` | List, create, edit, activate/deactivate |
| `features/roles/RolePermissionsDialog.tsx` | Assign and remove a role's permissions |
| `app/roles/page.tsx` | Route |
| Spec files | CRUD states plus the assignment interaction |

## Technical Details

**Assignment uses a searchable list of unassigned permissions**, not a long unfiltered select.
The catalogue is 18 today and will grow; scrolling an unfiltered list is the thing the frontend
standards call out.

**Already-assigned permissions are not offered**, so the 409 path is unreachable through normal
use — but a 409 is still handled, because a second administrator could assign concurrently.

**Removal is deactivation (D-8).** The confirmation says the permission will no longer apply,
not that it will be erased, and re-adding is an ordinary assign — the backend reactivates the
same row. **No separate "reactivate" control**, per run 004's note.

**Deactivating a role has a consequence invisible on this screen**: users keep the role but
resolve to no permissions through it (FR-AC3). The confirmation copy says so.

**Conflict attribution** follows run 014's pattern — a role has one unique field, `name`, so the
form attributes a 409 to it.

---
*Plan approved at checkpoint. Execution follows.*
