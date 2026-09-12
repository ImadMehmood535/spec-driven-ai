import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { IUserPermissionQueries } from './abstraction/IUserPermissionQueries';

interface NameRow {
  name: string;
}

interface CountRow {
  count: string;
}

/**
 * Resolution is a single query with four independent status gates — the user,
 * the role, the role-permission link, and the permission itself (FR-AC3).
 * Omitting any one of them would grant revoked access while looking correct,
 * so each has its own test.
 *
 * The INNER JOIN on Role also gives FR-AC4: a user with a null roleId matches
 * no rows and therefore holds no permissions.
 */
@Injectable()
export class UserPermissionQueries implements IUserPermissionQueries {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async findEffectivePermissionNames(userId: number): Promise<string[]> {
    const rows = await this.sequelize.query<NameRow>(
      `SELECT DISTINCT p."name"
         FROM "User" u
         JOIN "Role" r            ON r."id" = u."roleId"
         JOIN "RolePermission" rp ON rp."roleId" = r."id"
         JOIN "Permission" p      ON p."id" = rp."permissionId"
        WHERE u."id" = :userId
          AND u."entityStatus"  = :active
          AND r."entityStatus"  = :active
          AND rp."entityStatus" = :active
          AND p."entityStatus"  = :active
        ORDER BY p."name" ASC`,
      {
        replacements: { userId, active: EntityStatus.Active },
        type: QueryTypes.SELECT,
      },
    );

    return rows.map((row) => row.name);
  }

  async userExists(userId: number): Promise<boolean> {
    const rows = await this.sequelize.query<CountRow>(
      `SELECT COUNT(*)::text AS count FROM "User" WHERE "id" = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT },
    );

    return Number(rows[0]?.count ?? 0) > 0;
  }
}
