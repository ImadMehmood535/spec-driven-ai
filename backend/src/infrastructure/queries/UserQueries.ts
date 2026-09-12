import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { UserModel } from '@domain/aggregates/UserAggregate/UserModel';
import {
  IUserQueries,
  UserListFilter,
  UserListResult,
  UserReadModel,
} from './abstraction/IUserQueries';

/**
 * `passwordHash` is never selected. The attribute list is explicit rather than
 * exclusion-based, so a future column cannot leak by default (NFR-3).
 */
const SELECTED_ATTRIBUTES = [
  'id',
  'globalUId',
  'email',
  'username',
  'firstName',
  'lastName',
  'roleId',
  'entityStatus',
  'createdAt',
  'modifiedOn',
] as const;

@Injectable()
export class UserQueries implements IUserQueries {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async findList(filter: UserListFilter): Promise<UserListResult> {
    const conditions: WhereOptions[] = [];

    if (filter.entityStatus) {
      conditions.push({ entityStatus: filter.entityStatus });
    }
    if (filter.roleId !== undefined) {
      conditions.push({ roleId: filter.roleId });
    }
    if (filter.search && filter.search.trim().length > 0) {
      const term = `%${filter.search.trim()}%`;
      conditions.push({
        [Op.or]: [
          { firstName: { [Op.iLike]: term } },
          { lastName: { [Op.iLike]: term } },
          { email: { [Op.iLike]: term } },
          { username: { [Op.iLike]: term } },
        ],
      });
    }

    const where: WhereOptions =
      conditions.length > 0 ? { [Op.and]: conditions } : {};

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      attributes: [...SELECTED_ATTRIBUTES],
      include: [{ model: RoleModel, required: false }],
      order: [['id', 'DESC']],
      limit: filter.size,
      offset: (filter.page - 1) * filter.size,
    });

    return { rows: rows.map((row) => this.toReadModel(row)), total: count };
  }

  async findById(id: number): Promise<UserReadModel | null> {
    const row = await this.userModel.findOne({
      where: { id },
      attributes: [...SELECTED_ATTRIBUTES],
      include: [{ model: RoleModel, required: false }],
    });
    return row ? this.toReadModel(row) : null;
  }

  private toReadModel(row: UserModel): UserReadModel {
    return {
      id: Number(row.id),
      globalUId: row.globalUId,
      email: row.email,
      username: row.username,
      firstName: row.firstName,
      lastName: row.lastName,
      roleId: row.roleId === null ? null : Number(row.roleId),
      roleName: row.role ? row.role.name : null,
      entityStatus: row.entityStatus,
      createdAt: row.createdAt.toISOString(),
      modifiedOn: row.modifiedOn ? row.modifiedOn.toISOString() : null,
    };
  }
}
