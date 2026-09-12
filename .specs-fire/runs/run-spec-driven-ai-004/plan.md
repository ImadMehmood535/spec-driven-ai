---
run: run-spec-driven-ai-004
work_item: role-crud
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-12T17:00:00Z
---

# Implementation Plan: Role Management Slice

> Checkpoint self-served under the user's standing instruction to run the loop autonomously.

## Approach

Same shape as `permission-crud`, which run 003 established as the template: aggregate →
repository (write) → query class (read) → four CQRS features → controller. Satisfies
FR-R1–FR-R4. Assigning permissions to a role (FR-R5) is the next work item, since it needs the
RolePermission relationship.

The slice was generated from the permission slice by substitution, then **every file reviewed
and corrected** — substitution reproduces structure but carries the wrong semantics with it.

## Files to Create

20 files mirroring the permission slice: `Role` aggregate, `IRoleRepository` +
`RoleRepository`, `IRoleQueries` + `RoleQueries`, `RolePersistenceModule`, `RoleModule`,
four feature folders (`createrole`, `getrole`, `getroles`, `updaterole`), `RoleController`,
and six spec files.

## Files to Modify

| File | Changes |
|------|---------|
| `backend/src/api/ApiModule.ts` | Register `RoleModule` and `RoleController` |
| `backend/src/api/controllers/AppController.spec.ts` | Stub the `RoleModel` token too |

## Technical Details

**Deactivating a role must not cascade.** The work item is explicit: FR-AC3 handles the
consequence at resolution time by excluding permissions reached through an inactive role. A test
asserts the repository exposes no method that could deactivate users or links, and live
verification confirmed user and link counts stayed at 0 after a role was deactivated.

**Role names are human-readable**, not action names — "Developer Admin", per `docs/scope.md` §5.
Every Swagger example and test fixture had to be changed from the permission slice's
`project.create` style.

---
*Plan approved at checkpoint. Execution follows.*
