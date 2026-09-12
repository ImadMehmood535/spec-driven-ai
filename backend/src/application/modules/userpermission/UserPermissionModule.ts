import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserPermissionPersistenceModule } from '@infrastructure/persistence/UserPermissionPersistenceModule';
import { CheckUserPermissionQueryHandler } from './features/checkuserpermission/CheckUserPermissionQueryHandler';
import { GetUserPermissionsQueryHandler } from './features/getuserpermissions/GetUserPermissionsQueryHandler';

@Module({
  imports: [CqrsModule, UserPermissionPersistenceModule],
  providers: [GetUserPermissionsQueryHandler, CheckUserPermissionQueryHandler],
  exports: [CqrsModule],
})
export class UserPermissionModule {}
