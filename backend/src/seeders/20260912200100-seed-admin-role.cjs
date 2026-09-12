'use strict';

const { randomUUID } = require('crypto');
const { ADMIN_ROLE } = require('../config/seed-catalogue.cjs');

/** Idempotent by role name (FR-S2, FR-S4). */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [existing] = await queryInterface.sequelize.query(
      `SELECT "id", "entityStatus" FROM "Role" WHERE "name" = :name LIMIT 1`,
      { replacements: { name: ADMIN_ROLE.name }, type: 'SELECT' },
    );

    if (existing) {
      if (existing.entityStatus !== 'ACTIVE') {
        await queryInterface.sequelize.query(
          `UPDATE "Role" SET "entityStatus" = 'ACTIVE', "modifiedOn" = :now WHERE "id" = :id`,
          { replacements: { id: existing.id, now } },
        );
      }
      return;
    }

    await queryInterface.bulkInsert('Role', [
      {
        globalUId: randomUUID(),
        name: ADMIN_ROLE.name,
        description: ADMIN_ROLE.description,
        entityStatus: 'ACTIVE',
        createdAt: now,
        modifiedOn: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM "Role" WHERE "name" = :name`,
      { replacements: { name: ADMIN_ROLE.name } },
    );
  },
};
