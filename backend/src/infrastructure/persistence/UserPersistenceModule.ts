import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { UserModel } from '@domain/aggregates/UserAggregate/UserModel';
import { BcryptPasswordHasher } from '@infrastructure/security/BcryptPasswordHasher';
import { USER_QUERIES } from '@infrastructure/queries/abstraction/IUserQueries';
import { UserQueries } from '@infrastructure/queries/UserQueries';
import { USER_REPOSITORY } from '@infrastructure/repositories/abstraction/IUserRepository';
import { UserRepository } from '@infrastructure/repositories/UserRepository';
import { PASSWORD_HASHER } from '@shared/security/IPasswordHasher';

@Module({
  imports: [SequelizeModule.forFeature([UserModel, RoleModel])],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: USER_QUERIES, useClass: UserQueries },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  ],
  exports: [USER_REPOSITORY, USER_QUERIES, PASSWORD_HASHER],
})
export class UserPersistenceModule {}
