---
id: role-permission-assignment
title: Role Permission Assignment
intent: developer-user-module
complexity: medium
mode: confirm
status: pending
depends_on: [role-crud, permission-crud]
created: 2026-09-12T12:38:02Z
---

# Work Item: Role Permission Assignment

## Description

The RolePermission relationship: attaching permissions to a role, removing them, and listing a
role's permissions. Satisfies FR-R5 and FR-RP1–FR-RP4.

## Acceptance Criteria

- [ ] `RolePermission` aggregate with private constructor, `create`/`rehydrate`, valid-status guard
- [ ] `RolePermissionModel` maps to the `RolePermission` table with both foreign keys
- [ ] `IRolePermissionRepository` + `ROLE_PERMISSION_REPOSITORY`; repository with private `toDomain`
- [ ] `IRolePermissionQueries` + `ROLE_PERMISSION_QUERIES` for read access
- [ ] Persistence module binds and exports both tokens
- [ ] **Assign** one or more permissions to a role in a single request (FR-RP1, FR-R5)
- [ ] **Remove** a permission from a role by **deactivating the link row** — `entityStatus` set to `INACTIVE`, row retained (FR-RP2, **D-8**)
- [ ] Re-assigning a previously removed permission **reactivates the existing row**, never inserts a duplicate (D-8, FR-RP4)
- [ ] **View** the permissions assigned to a role (FR-RP3) — returns permission details, not bare ids
- [ ] Listing a role's permissions excludes deactivated links by default (D-8, FR-AC3)
- [ ] Assigning a permission already **actively** on that role returns **409**, and the DB unique constraint backs it (FR-RP4)
- [ ] Assigning to a non-existent role returns **404**; assigning a non-existent permission returns **404**
- [ ] A multi-permission assignment is atomic — either all land or none do
- [ ] Swagger on every route and DTO (NFR-2)
- [ ] Tests: duplicate active assignment conflicts, removal deactivates rather than deletes, re-assignment reactivates the same row, missing role, missing permission, partial-failure atomicity, listing excludes inactive links

## Technical Notes

Routes live under the role resource (e.g. role-scoped paths), since every operation is
"this role's permissions".

**Removal is deactivation** (D-8): set the link's `entityStatus` to `INACTIVE` and keep the
row. History survives, and FR-AC3 already drops inactive links from resolution.

The consequence to handle carefully: with rows retained, `UNIQUE (roleId, permissionId)` means
a second assignment of the same pair cannot insert. Re-assignment must therefore find the
existing row and reactivate it. A naive "insert on assign" will hit a constraint violation the
first time an operator removes a permission and adds it back.

So "already assigned" (409) means *already assigned and active*. An inactive row is not a
conflict — it is the row to reactivate.

Atomicity for multi-assign means a transaction — the first place this module needs one.

## Dependencies

- role-crud
- permission-crud
