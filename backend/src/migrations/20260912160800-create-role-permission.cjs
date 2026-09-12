'use strict';

const TABLE = 'RolePermission';
const ENUM_TYPE = 'enum_RolePermission_entityStatus';

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
      roleId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Role', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      permissionId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Permission', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      // Link-level status: FR-AC3 requires a deactivated link to drop out of
      // permission resolution independently of the role or permission it joins.
      entityStatus: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      modifiedOn: { type: Sequelize.DATE, allowNull: true },
    });

    // FR-RP4. D-8 relies on the row surviving removal, so removal deactivates
    // and re-assignment reactivates this same row rather than inserting.
    await queryInterface.addConstraint(TABLE, {
      fields: ['roleId', 'permissionId'],
      type: 'unique',
      name: 'RolePermission_roleId_permissionId_unique',
    });
    await queryInterface.addIndex(TABLE, ['roleId'], {
      name: 'RolePermission_roleId_index',
    });
    await queryInterface.addIndex(TABLE, ['permissionId'], {
      name: 'RolePermission_permissionId_index',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(TABLE, 'RolePermission_permissionId_index');
    await queryInterface.removeIndex(TABLE, 'RolePermission_roleId_index');
    await queryInterface.removeConstraint(
      TABLE,
      'RolePermission_roleId_permissionId_unique',
    );
    await queryInterface.dropTable(TABLE);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUM_TYPE}";`);
  },
};
