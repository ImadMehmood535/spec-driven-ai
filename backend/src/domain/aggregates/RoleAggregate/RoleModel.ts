import { Column, DataType, HasMany, Table } from 'sequelize-typescript';
import { BaseModel } from '@domain/aggregates/BaseModel';
import { RolePermissionModel } from '@domain/aggregates/RolePermissionAggregate/RolePermissionModel';
import { UserModel } from '@domain/aggregates/UserAggregate/UserModel';
import { TableNames } from '@domain/common/TableNames';
import { EntityStatus } from '@shared/enums/EntityStatus';

@Table({ tableName: TableNames.Role, timestamps: false })
export class RoleModel extends BaseModel {
  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  name!: string;

  @Column({ type: DataType.STRING(512), allowNull: true })
  description!: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(EntityStatus)),
    allowNull: false,
  })
  entityStatus!: EntityStatus;

  @HasMany(() => UserModel, { onDelete: 'RESTRICT' })
  users!: UserModel[];

  @HasMany(() => RolePermissionModel, { onDelete: 'RESTRICT' })
  rolePermissions!: RolePermissionModel[];
}
