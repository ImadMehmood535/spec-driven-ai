import { Module } from '@nestjs/common';
import { AUTH_QUERIES } from '@infrastructure/queries/abstraction/IAuthQueries';
import { AuthQueries } from '@infrastructure/queries/AuthQueries';
import { BcryptPasswordHasher } from '@infrastructure/security/BcryptPasswordHasher';
import { PASSWORD_HASHER } from '@shared/security/IPasswordHasher';

@Module({
  providers: [
    { provide: AUTH_QUERIES, useClass: AuthQueries },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  ],
  exports: [AUTH_QUERIES, PASSWORD_HASHER],
})
export class AuthPersistenceModule {}
