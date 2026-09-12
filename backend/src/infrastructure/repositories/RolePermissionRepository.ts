import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { RolePermission } from '@domain/aggregates/RolePermissionAggregate/RolePermission';
import { RolePermissionModel } from '@domain/aggregates/RolePermissionAggregate/RolePermissionModel';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { IRolePermissionRepository } from './abstraction/IRolePermissionRepository';

@Injectable()
export class RolePermissionRepository implements IRolePermissionRepository {
  constructor(
    @InjectModel(RolePermissionModel)
    private readonly rolePermissionModel: typeof RolePermissionModel,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * All-or-nothing (FR-RP1). An existing-but-inactive link is reactivated
   * rather than inserted: UNIQUE(roleId, permissionId) forbids a duplicate,
   * so a plain insert would fail the first time an operator removes a
   * permission and adds it back (D-8).
   */
  async assignMany(roleId: number, permissionIds: number[]): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      for (const permissionId of permissionIds) {
        const existing = await this.rolePermissionModel.findOne({
          where: { roleId, permissionId },
          transaction,
        });

        if (existing) {
          await existing.update(
            { entityStatus: EntityStatus.Active },
            { transaction },
          );
          continue;
        }

        await this.rolePermissionModel.create(
          { roleId, permissionId, entityStatus: EntityStatus.Active },
          { transaction },
        );
      }
    });
  }

  async findByRoleAndPermission(
    roleId: number,
    permissionId: number,
  ): Promise<RolePermission | null> {
    const row = await this.rolePermissionModel.findOne({
      where: { roleId, permissionId },
    });
    return row ? this.toDomain(row) : null;
  }

  async updateLink(link: RolePermission): Promise<void> {
    await this.rolePermissionModel.update(
      { entityStatus: link.entityStatus },
      { where: { id: link.id as number } },
    );
  }

  async activePermissionIds(roleId: number): Promise<number[]> {
    const rows = await this.rolePermissionModel.findAll({
      where: { roleId, entityStatus: EntityStatus.Active },
      attributes: ['permissionId'],
    });
    return rows.map((row) => Number(row.permissionId));
  }

  private toDomain(row: RolePermissionModel): RolePermission {
    return RolePermission.rehydrate(
      Number(row.id),
      Number(row.roleId),
      Number(row.permissionId),
      row.entityStatus,
    );
  }
}
