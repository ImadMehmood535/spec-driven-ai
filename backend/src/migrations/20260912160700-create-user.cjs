'use strict';

const TABLE = 'User';
const ENUM_TYPE = 'enum_User_entityStatus';

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
      // Nullable: FR-AC4 requires a user with no role, resolving to no permissions.
      roleId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'Role', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      email: { type: Sequelize.STRING(255), allowNull: false },
      username: { type: Sequelize.STRING(255), allowNull: false },
      firstName: { type: Sequelize.STRING(255), allowNull: false },
      lastName: { type: Sequelize.STRING(255), allowNull: false },
      // NOT NULL: a user cannot exist without a credential, so there is no
      // "no password set" state to confuse with "any password accepted".
      passwordHash: { type: Sequelize.STRING(255), allowNull: false },
      entityStatus: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      modifiedOn: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addConstraint(TABLE, {
      fields: ['email'],
      type: 'unique',
      name: 'User_email_unique',
    });
    await queryInterface.addConstraint(TABLE, {
      fields: ['username'],
      type: 'unique',
      name: 'User_username_unique',
    });
    await queryInterface.addIndex(TABLE, ['roleId'], {
      name: 'User_roleId_index',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(TABLE, 'User_roleId_index');
    await queryInterface.removeConstraint(TABLE, 'User_username_unique');
    await queryInterface.removeConstraint(TABLE, 'User_email_unique');
    await queryInterface.dropTable(TABLE);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUM_TYPE}";`);
  },
};
