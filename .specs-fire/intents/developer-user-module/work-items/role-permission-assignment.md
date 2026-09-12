---
id: role-permission-assignment
title: Role Permission Assignment
intent: developer-user-module
complexity: medium
mode: validate
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
- [ ] **Remove** a permission from a role (FR-RP2) — a relationship change, not an entity delete (D-5)
- [ ] **View** the permissions assigned to a role (FR-RP3) — returns permission details, not bare ids
- [ ] Assigning a permission already on that role returns **409**, and the DB unique constraint backs it (FR-RP4)
- [ ] Assigning to a non-existent role returns **404**; assigning a non-existent permission returns **404**
- [ ] A multi-permission assignment is atomic — either all land or none do
- [ ] Swagger on every route and DTO (NFR-2)
- [ ] Tests: duplicate assignment conflict, missing role, missing permission, partial-failure atomicity, listing a role's permissions

## Technical Notes

Routes live under the role resource (e.g. role-scoped paths), since every operation is
"this role's permissions".

Removal semantics need care: FR-RP2 says *remove*, and the table has `entityStatus` for
FR-AC3's benefit. Decide during design whether removal deletes the link row or deactivates it.
Deleting a join row is not an entity delete and does not conflict with D-5 — but deactivating
keeps history. Record the choice in the design doc; do not leave it implicit.

Atomicity for multi-assign means a transaction — the first place this module needs one.

## Dependencies

- role-crud
- permission-crud
