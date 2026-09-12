import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { RolePermissionModel } from '@domain/aggregates/RolePermissionAggregate/RolePermissionModel';
import { EntityStatus } from '@shared/enums/EntityStatus';
import {
  IRolePermissionQueries,
  RolePermissionReadModel,
} from './abstraction/IRolePermissionQueries';

@Injectable()
export class RolePermissionQueries implements IRolePermissionQueries {
  constructor(
    @InjectModel(RolePermissionModel)
    private readonly rolePermissionModel: typeof RolePermissionModel,
  ) {}

  async findByRole(
    roleId: number,
    includeInactive = false,
  ): Promise<RolePermissionReadModel[]> {
    // Deactivated links are excluded by default: D-8 keeps the row, so a
    // caller asking for a role's permissions must not see removed ones.
    const where = includeInactive
      ? { roleId }
      : { roleId, entityStatus: EntityStatus.Active };

    const rows = await this.rolePermissionModel.findAll({
      where,
      include: [{ model: PermissionModel, required: true }],
      order: [['id', 'ASC']],
    });

    return rows.map((row) => this.toReadModel(row));
  }

  private toReadModel(row: RolePermissionModel): RolePermissionReadModel {
    return {
      linkId: Number(row.id),
      permissionId: Number(row.permissionId),
      name: row.permission.name,
      description: row.permission.description,
      permissionStatus: row.permission.entityStatus,
      linkStatus: row.entityStatus,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
