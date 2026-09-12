'use strict';

/**
 * Every permission this module seeds, in one place so the seeders and the
 * route guards cannot disagree about the names.
 *
 * Activate/deactivate rides on `update` because that is how the routes
 * actually work — a separate `*.activate` permission would describe an API
 * that does not exist.
 */

/** Actions belonging to other modules, from docs/scope.md §5 (FR-S1). */
const PROJECT_PERMISSIONS = [
  { name: 'project.create', description: 'Create a project' },
  { name: 'project.update', description: 'Update a project' },
  { name: 'project.delete', description: 'Delete a project' },
  { name: 'project.view', description: 'View a project' },
];

/** This module's own routes — the names route-protection requires (FR-S6). */
const MODULE_PERMISSIONS = [
  { name: 'user.create', description: 'Create a user' },
  { name: 'user.view', description: 'View users' },
  { name: 'user.update', description: 'Update a user, including activate/deactivate' },
  { name: 'user.assign-role', description: "Assign a role to a user" },
  { name: 'user.change-password', description: "Change a user's password" },
  { name: 'role.create', description: 'Create a role' },
  { name: 'role.view', description: 'View roles' },
  { name: 'role.update', description: 'Update a role, including activate/deactivate' },
  { name: 'permission.create', description: 'Create a permission' },
  { name: 'permission.view', description: 'View permissions' },
  {
    name: 'permission.update',
    description: 'Update a permission, including activate/deactivate',
  },
  { name: 'role-permission.view', description: "View a role's permissions" },
  { name: 'role-permission.assign', description: 'Assign permissions to a role' },
  { name: 'role-permission.remove', description: 'Remove a permission from a role' },
];

const ALL_PERMISSIONS = [...PROJECT_PERMISSIONS, ...MODULE_PERMISSIONS];

const ADMIN_ROLE = {
  name: 'Developer Admin',
  description: 'Full access to the Developer platform',
};

module.exports = {
  PROJECT_PERMISSIONS,
  MODULE_PERMISSIONS,
  ALL_PERMISSIONS,
  ADMIN_ROLE,
};
