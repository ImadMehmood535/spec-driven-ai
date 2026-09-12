import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PermissionPersistenceModule } from '@infrastructure/persistence/PermissionPersistenceModule';
import { RolePermissionPersistenceModule } from '@infrastructure/persistence/RolePermissionPersistenceModule';
import { RolePersistenceModule } from '@infrastructure/persistence/RolePersistenceModule';
import { AssignPermissionsCommandHandler } from './features/assignpermissions/AssignPermissionsCommandHandler';
import { GetRolePermissionsQueryHandler } from './features/getrolepermissions/GetRolePermissionsQueryHandler';
import { RemovePermissionCommandHandler } from './features/removepermission/RemovePermissionCommandHandler';

@Module({
  imports: [
    CqrsModule,
    RolePermissionPersistenceModule,
    RolePersistenceModule,
    PermissionPersistenceModule,
  ],
  providers: [
    AssignPermissionsCommandHandler,
    RemovePermissionCommandHandler,
    GetRolePermissionsQueryHandler,
  ],
  exports: [CqrsModule],
})
export class RolePermissionModule {}
