import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { BaseModel } from '@domain/aggregates/BaseModel';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { TableNames } from '@domain/common/TableNames';
import { EntityStatus } from '@shared/enums/EntityStatus';

@Table({
  tableName: TableNames.RolePermission,
  timestamps: false,
  indexes: [
    {
      name: 'RolePermission_roleId_permissionId_unique',
      unique: true,
      fields: ['roleId', 'permissionId'],
    },
  ],
})
export class RolePermissionModel extends BaseModel {
  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.BIGINT, allowNull: false })
  roleId!: number;

  @BelongsTo(() => RoleModel)
  role!: RoleModel;

  @ForeignKey(() => PermissionModel)
  @Column({ type: DataType.BIGINT, allowNull: false })
  permissionId!: number;

  @BelongsTo(() => PermissionModel)
  permission!: PermissionModel;

  // Link-level status: FR-AC3 requires a deactivated link to drop out of
  // permission resolution independently of the role or permission it joins.
  @Column({
    type: DataType.ENUM(...Object.values(EntityStatus)),
    allowNull: false,
  })
  entityStatus!: EntityStatus;
}
