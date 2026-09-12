import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { PERMISSION_QUERIES } from '@infrastructure/queries/abstraction/IPermissionQueries';
import { PermissionQueries } from '@infrastructure/queries/PermissionQueries';
import { PERMISSION_REPOSITORY } from '@infrastructure/repositories/abstraction/IPermissionRepository';
import { PermissionRepository } from '@infrastructure/repositories/PermissionRepository';

@Module({
  imports: [SequelizeModule.forFeature([PermissionModel])],
  providers: [
    { provide: PERMISSION_REPOSITORY, useClass: PermissionRepository },
    { provide: PERMISSION_QUERIES, useClass: PermissionQueries },
  ],
  exports: [PERMISSION_REPOSITORY, PERMISSION_QUERIES],
})
export class PermissionPersistenceModule {}
