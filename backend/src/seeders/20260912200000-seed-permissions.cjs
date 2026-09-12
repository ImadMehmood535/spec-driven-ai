'use strict';

const { randomUUID } = require('crypto');
const { ALL_PERMISSIONS } = require('../config/seed-catalogue.cjs');

/**
 * Idempotent by permission name (FR-S4). A row that exists is left alone
 * except that a deactivated one is reactivated — otherwise a seed would
 * appear to do nothing after someone deactivated a catalogue permission.
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    for (const permission of ALL_PERMISSIONS) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT "id", "entityStatus" FROM "Permission" WHERE "name" = :name LIMIT 1`,
        { replacements: { name: permission.name }, type: 'SELECT' },
      );

      if (existing) {
        if (existing.entityStatus !== 'ACTIVE') {
          await queryInterface.sequelize.query(
            `UPDATE "Permission"
                SET "entityStatus" = 'ACTIVE', "modifiedOn" = :now
              WHERE "id" = :id`,
            { replacements: { id: existing.id, now } },
          );
        }
        continue;
      }

      await queryInterface.bulkInsert('Permission', [
        {
          globalUId: randomUUID(),
          name: permission.name,
          description: permission.description,
          entityStatus: 'ACTIVE',
          createdAt: now,
          modifiedOn: null,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM "Permission" WHERE "name" IN (:names)`,
      { replacements: { names: ALL_PERMISSIONS.map((p) => p.name) } },
    );
  },
};
