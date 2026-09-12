import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { ROLE_QUERIES } from '@infrastructure/queries/abstraction/IRoleQueries';
import { RoleQueries } from '@infrastructure/queries/RoleQueries';
import { ROLE_REPOSITORY } from '@infrastructure/repositories/abstraction/IRoleRepository';
import { RoleRepository } from '@infrastructure/repositories/RoleRepository';

@Module({
  imports: [SequelizeModule.forFeature([RoleModel])],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: RoleRepository },
    { provide: ROLE_QUERIES, useClass: RoleQueries },
  ],
  exports: [ROLE_REPOSITORY, ROLE_QUERIES],
})
export class RolePersistenceModule {}
