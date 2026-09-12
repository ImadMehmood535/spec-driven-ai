import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RolePersistenceModule } from '@infrastructure/persistence/RolePersistenceModule';
import { UserPersistenceModule } from '@infrastructure/persistence/UserPersistenceModule';
import { AssignRoleCommandHandler } from './features/assignrole/AssignRoleCommandHandler';
import { ChangePasswordCommandHandler } from './features/changepassword/ChangePasswordCommandHandler';
import { CreateUserCommandHandler } from './features/createuser/CreateUserCommandHandler';
import { GetUserQueryHandler } from './features/getuser/GetUserQueryHandler';
import { GetUsersQueryHandler } from './features/getusers/GetUsersQueryHandler';
import { UpdateUserCommandHandler } from './features/updateuser/UpdateUserCommandHandler';

@Module({
  imports: [CqrsModule, UserPersistenceModule, RolePersistenceModule],
  providers: [
    CreateUserCommandHandler,
    UpdateUserCommandHandler,
    AssignRoleCommandHandler,
    ChangePasswordCommandHandler,
    GetUserQueryHandler,
    GetUsersQueryHandler,
  ],
  exports: [CqrsModule],
})
export class UserModule {}
