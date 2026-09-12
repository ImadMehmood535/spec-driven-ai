import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { RolePermissionModel } from '@domain/aggregates/RolePermissionAggregate/RolePermissionModel';
import { ROLE_PERMISSION_QUERIES } from '@infrastructure/queries/abstraction/IRolePermissionQueries';
import { RolePermissionQueries } from '@infrastructure/queries/RolePermissionQueries';
import { ROLE_PERMISSION_REPOSITORY } from '@infrastructure/repositories/abstraction/IRolePermissionRepository';
import { RolePermissionRepository } from '@infrastructure/repositories/RolePermissionRepository';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RolePermissionModel,
      RoleModel,
      PermissionModel,
    ]),
  ],
  providers: [
    { provide: ROLE_PERMISSION_REPOSITORY, useClass: RolePermissionRepository },
    { provide: ROLE_PERMISSION_QUERIES, useClass: RolePermissionQueries },
  ],
  exports: [ROLE_PERMISSION_REPOSITORY, ROLE_PERMISSION_QUERIES],
})
export class RolePermissionPersistenceModule {}
