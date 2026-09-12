import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AuthUserReadModel, IAuthQueries } from './abstraction/IAuthQueries';

@Injectable()
export class AuthQueries implements IAuthQueries {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async findByIdentifier(
    identifier: string,
  ): Promise<AuthUserReadModel | null> {
    const value = identifier.trim();

    const rows = await this.sequelize.query<AuthUserReadModel>(
      `SELECT u."id",
              u."globalUId",
              u."username",
              u."passwordHash",
              u."entityStatus",
              r."name" AS "roleName"
         FROM "User" u
         LEFT JOIN "Role" r ON r."id" = u."roleId"
        WHERE u."email" = :email OR u."username" = :username
        LIMIT 1`,
      {
        // Email is stored lowercased by the aggregate; username is not.
        replacements: { email: value.toLowerCase(), username: value },
        type: QueryTypes.SELECT,
      },
    );

    return rows[0] ?? null;
  }
}
