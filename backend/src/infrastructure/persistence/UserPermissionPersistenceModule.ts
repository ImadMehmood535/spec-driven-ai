import { Module } from '@nestjs/common';
import { USER_PERMISSION_QUERIES } from '@infrastructure/queries/abstraction/IUserPermissionQueries';
import { UserPermissionQueries } from '@infrastructure/queries/UserPermissionQueries';

@Module({
  providers: [
    { provide: USER_PERMISSION_QUERIES, useClass: UserPermissionQueries },
  ],
  exports: [USER_PERMISSION_QUERIES],
})
export class UserPermissionPersistenceModule {}
