import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { IPermissionRepository } from './abstraction/IPermissionRepository';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @InjectModel(PermissionModel)
    private readonly permissionModel: typeof PermissionModel,
  ) {}

  async save(permission: Permission): Promise<Permission> {
    const created = await this.permissionModel.create({
      name: permission.name,
      description: permission.description,
      entityStatus: permission.entityStatus,
    });

    return this.toDomain(created);
  }

  async updatePermission(permission: Permission): Promise<void> {
    await this.permissionModel.update(
      {
        name: permission.name,
        description: permission.description,
        entityStatus: permission.entityStatus,
      },
      { where: { id: permission.id as number } },
    );
  }

  async findById(id: number): Promise<Permission | null> {
    const row = await this.permissionModel.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async nameExists(name: string, exceptId?: number): Promise<boolean> {
    const where =
      exceptId === undefined ? { name } : { name, id: { [Op.ne]: exceptId } };
    const count = await this.permissionModel.count({ where });
    return count > 0;
  }

  private toDomain(row: PermissionModel): Permission {
    return Permission.rehydrate(
      Number(row.id),
      row.name,
      row.description,
      row.entityStatus,
    );
  }
}
