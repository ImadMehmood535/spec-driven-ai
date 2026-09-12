'use strict';

const { randomUUID } = require('crypto');
const { ADMIN_ROLE } = require('../config/seed-catalogue.cjs');

/**
 * Links the administrator role to **every** permission in the table (FR-S7,
 * D-7). The list is computed at run time rather than hard-coded, so a
 * permission added later is granted on the next run instead of the seed
 * silently going stale and locking the administrator out of new routes.
 *
 * Reactivates an existing-but-inactive link, matching D-8's semantics: the
 * UNIQUE(roleId, permissionId) constraint means an insert would fail.
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [role] = await queryInterface.sequelize.query(
      `SELECT "id" FROM "Role" WHERE "name" = :name LIMIT 1`,
      { replacements: { name: ADMIN_ROLE.name }, type: 'SELECT' },
    );

    if (!role) {
      throw new Error(
        `Seed failed: the "${ADMIN_ROLE.name}" role does not exist. Run the role seeder first.`,
      );
    }

    const permissions = await queryInterface.sequelize.query(
      `SELECT "id" FROM "Permission"`,
      { type: 'SELECT' },
    );

    for (const permission of permissions) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT "id", "entityStatus" FROM "RolePermission"
          WHERE "roleId" = :roleId AND "permissionId" = :permissionId LIMIT 1`,
        {
          replacements: { roleId: role.id, permissionId: permission.id },
          type: 'SELECT',
        },
      );

      if (existing) {
        if (existing.entityStatus !== 'ACTIVE') {
          await queryInterface.sequelize.query(
            `UPDATE "RolePermission"
                SET "entityStatus" = 'ACTIVE', "modifiedOn" = :now
              WHERE "id" = :id`,
            { replacements: { id: existing.id, now } },
          );
        }
        continue;
      }

      await queryInterface.bulkInsert('RolePermission', [
        {
          globalUId: randomUUID(),
          roleId: role.id,
          permissionId: permission.id,
          entityStatus: 'ACTIVE',
          createdAt: now,
          modifiedOn: null,
        },
      ]);
    }
  },

  async down(queryInterface) {
    const [role] = await queryInterface.sequelize.query(
      `SELECT "id" FROM "Role" WHERE "name" = :name LIMIT 1`,
      { replacements: { name: ADMIN_ROLE.name }, type: 'SELECT' },
    );

    if (role) {
      await queryInterface.sequelize.query(
        `DELETE FROM "RolePermission" WHERE "roleId" = :roleId`,
        { replacements: { roleId: role.id } },
      );
    }
  },
};
