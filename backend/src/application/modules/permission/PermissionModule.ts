import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PermissionPersistenceModule } from '@infrastructure/persistence/PermissionPersistenceModule';
import { CreatePermissionCommandHandler } from './features/createpermission/CreatePermissionCommandHandler';
import { GetPermissionQueryHandler } from './features/getpermission/GetPermissionQueryHandler';
import { GetPermissionsQueryHandler } from './features/getpermissions/GetPermissionsQueryHandler';
import { UpdatePermissionCommandHandler } from './features/updatepermission/UpdatePermissionCommandHandler';

@Module({
  imports: [CqrsModule, PermissionPersistenceModule],
  providers: [
    CreatePermissionCommandHandler,
    UpdatePermissionCommandHandler,
    GetPermissionQueryHandler,
    GetPermissionsQueryHandler,
  ],
  exports: [CqrsModule],
})
export class PermissionModule {}
