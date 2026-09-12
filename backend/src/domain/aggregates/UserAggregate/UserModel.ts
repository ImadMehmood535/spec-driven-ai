import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { BaseModel } from '@domain/aggregates/BaseModel';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { TableNames } from '@domain/common/TableNames';
import { EntityStatus } from '@shared/enums/EntityStatus';

@Table({ tableName: TableNames.User, timestamps: false })
export class UserModel extends BaseModel {
  // Nullable: FR-AC4 requires a user with no role, resolving to no permissions.
  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.BIGINT, allowNull: true })
  roleId!: number | null;

  @BelongsTo(() => RoleModel)
  role!: RoleModel | null;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  username!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  firstName!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  lastName!: string;

  // Never selected into a read model, never returned, never logged (NFR-3).
  @Column({ type: DataType.STRING(255), allowNull: false })
  passwordHash!: string;

  @Column({
    type: DataType.ENUM(...Object.values(EntityStatus)),
    allowNull: false,
  })
  entityStatus!: EntityStatus;
}
