import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import {
  IPermissionQueries,
  PermissionListFilter,
  PermissionListResult,
  PermissionReadModel,
} from './abstraction/IPermissionQueries';

@Injectable()
export class PermissionQueries implements IPermissionQueries {
  constructor(
    @InjectModel(PermissionModel)
    private readonly permissionModel: typeof PermissionModel,
  ) {}

  async findList(filter: PermissionListFilter): Promise<PermissionListResult> {
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

    const { rows, count } = await this.permissionModel.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit: filter.size,
      offset: (filter.page - 1) * filter.size,
    });

    return { rows: rows.map((row) => this.toReadModel(row)), total: count };
  }

  async findById(id: number): Promise<PermissionReadModel | null> {
    const row = await this.permissionModel.findOne({ where: { id } });
    return row ? this.toReadModel(row) : null;
  }

  private toReadModel(row: PermissionModel): PermissionReadModel {
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
