'use strict';

const TABLE = 'Role';
const ENUM_TYPE = 'enum_Role_entityStatus';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE, {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      globalUId: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.STRING(512), allowNull: true },
      entityStatus: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      modifiedOn: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addConstraint(TABLE, {
      fields: ['name'],
      type: 'unique',
      name: 'Role_name_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(TABLE, 'Role_name_unique');
    await queryInterface.dropTable(TABLE);
    // Postgres keeps the enum type after its table is dropped; a second `up`
    // would fail with "type already exists".
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUM_TYPE}";`);
  },
};
