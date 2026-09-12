import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Role } from '@domain/aggregates/RoleAggregate/Role';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { IRoleRepository } from './abstraction/IRoleRepository';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectModel(RoleModel)
    private readonly roleModel: typeof RoleModel,
  ) {}

  async save(role: Role): Promise<Role> {
    const created = await this.roleModel.create({
      name: role.name,
      description: role.description,
      entityStatus: role.entityStatus,
    });

    return this.toDomain(created);
  }

  async updateRole(role: Role): Promise<void> {
    await this.roleModel.update(
      {
        name: role.name,
        description: role.description,
        entityStatus: role.entityStatus,
      },
      { where: { id: role.id as number } },
    );
  }

  async findById(id: number): Promise<Role | null> {
    const row = await this.roleModel.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async nameExists(name: string, exceptId?: number): Promise<boolean> {
    const where =
      exceptId === undefined ? { name } : { name, id: { [Op.ne]: exceptId } };
    const count = await this.roleModel.count({ where });
    return count > 0;
  }

  private toDomain(row: RoleModel): Role {
    return Role.rehydrate(
      Number(row.id),
      row.name,
      row.description,
      row.entityStatus,
    );
  }
}
