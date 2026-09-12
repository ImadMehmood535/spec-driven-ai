'use strict';

const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');
const { ADMIN_ROLE } = require('../config/seed-catalogue.cjs');

const BCRYPT_COST = 12;

const REQUIRED_VARS = [
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_USERNAME',
  'SEED_ADMIN_PASSWORD',
];

/**
 * Creates the first administrator (FR-S3, D-6). Credentials come from the
 * environment and nowhere else — a default admin password would be a backdoor
 * in every environment that forgot to set one.
 *
 * Re-running NEVER resets an existing administrator's password (FR-S4), so a
 * routine deploy cannot be used to take over a live account.
 */
module.exports = {
  async up(queryInterface) {
    const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      throw new Error(
        `Seed failed: ${missing.join(', ')} must be set. ` +
          'The first administrator has no default credentials by design.',
      );
    }

    const email = process.env.SEED_ADMIN_EMAIL.trim().toLowerCase();
    const username = process.env.SEED_ADMIN_USERNAME.trim();
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

    const [existing] = await queryInterface.sequelize.query(
      `SELECT "id" FROM "User" WHERE "email" = :email LIMIT 1`,
      { replacements: { email }, type: 'SELECT' },
    );

    if (existing) {
      // Ensure the role and active status, but leave the password alone.
      await queryInterface.sequelize.query(
        `UPDATE "User"
            SET "roleId" = :roleId, "entityStatus" = 'ACTIVE', "modifiedOn" = :now
          WHERE "id" = :id`,
        { replacements: { id: existing.id, roleId: role.id, now } },
      );
      return;
    }

    const passwordHash = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD,
      BCRYPT_COST,
    );

    await queryInterface.bulkInsert('User', [
      {
        globalUId: randomUUID(),
        roleId: role.id,
        email,
        username,
        firstName: process.env.SEED_ADMIN_FIRST_NAME || 'Platform',
        lastName: process.env.SEED_ADMIN_LAST_NAME || 'Administrator',
        passwordHash,
        entityStatus: 'ACTIVE',
        createdAt: now,
        modifiedOn: null,
      },
    ]);
  },

  async down(queryInterface) {
    if (!process.env.SEED_ADMIN_EMAIL) {
      return;
    }
    await queryInterface.sequelize.query(
      `DELETE FROM "User" WHERE "email" = :email`,
      {
        replacements: {
          email: process.env.SEED_ADMIN_EMAIL.trim().toLowerCase(),
        },
      },
    );
  },
};
