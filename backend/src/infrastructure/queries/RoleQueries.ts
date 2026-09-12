import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import {
  IRoleQueries,
  RoleListFilter,
  RoleListResult,
  RoleReadModel,
} from './abstraction/IRoleQueries';

@Injectable()
export class RoleQueries implements IRoleQueries {
  constructor(
    @InjectModel(RoleModel)
    private readonly roleModel: typeof RoleModel,
  ) {}

  async findList(filter: RoleListFilter): Promise<RoleListResult> {
    const conditions: WhereOptions[] = [];

    if (filter.entityStatus) {
      conditions.push({ entityStatus: filter.entityStatus });
    }
    if (filter.search && filter.search.trim().length > 0) {
      const term = `%${filter.search.trim()}%`;
      conditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: term } },
          { description: { [Op.iLike]: term } },
        ],
      });
    }

    const where: WhereOptions =
      conditions.length > 0 ? { [Op.and]: conditions } : {};

    const { rows, count } = await this.roleModel.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit: filter.size,
      offset: (filter.page - 1) * filter.size,
    });

    return { rows: rows.map((row) => this.toReadModel(row)), total: count };
  }

  async findById(id: number): Promise<RoleReadModel | null> {
    const row = await this.roleModel.findOne({ where: { id } });
    return row ? this.toReadModel(row) : null;
  }

  private toReadModel(row: RoleModel): RoleReadModel {
    return {
      id: Number(row.id),
      globalUId: row.globalUId,
      name: row.name,
      description: row.description,
      entityStatus: row.entityStatus,
      createdAt: row.createdAt.toISOString(),
      modifiedOn: row.modifiedOn ? row.modifiedOn.toISOString() : null,
    };
  }
}
