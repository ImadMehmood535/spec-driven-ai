import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RolePersistenceModule } from '@infrastructure/persistence/RolePersistenceModule';
import { CreateRoleCommandHandler } from './features/createrole/CreateRoleCommandHandler';
import { GetRoleQueryHandler } from './features/getrole/GetRoleQueryHandler';
import { GetRolesQueryHandler } from './features/getroles/GetRolesQueryHandler';
import { UpdateRoleCommandHandler } from './features/updaterole/UpdateRoleCommandHandler';

@Module({
  imports: [CqrsModule, RolePersistenceModule],
  providers: [
    CreateRoleCommandHandler,
    UpdateRoleCommandHandler,
    GetRoleQueryHandler,
    GetRolesQueryHandler,
  ],
  exports: [CqrsModule],
})
export class RoleModule {}
