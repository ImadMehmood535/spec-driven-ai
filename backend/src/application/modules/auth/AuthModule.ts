import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuthPersistenceModule } from '@infrastructure/persistence/AuthPersistenceModule';
import { UserPermissionPersistenceModule } from '@infrastructure/persistence/UserPermissionPersistenceModule';
import { buildJwtOptions } from '@infrastructure/security/JwtConfig';
import { LoginCommandHandler } from './features/login/LoginCommandHandler';

@Module({
  imports: [
    CqrsModule,
    // Declared rather than relying on the root module making it global, so
    // this module can be composed in isolation (a test did exactly that).
    ConfigModule,
    AuthPersistenceModule,
    UserPermissionPersistenceModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildJwtOptions,
    }),
  ],
  providers: [LoginCommandHandler],
  exports: [CqrsModule, JwtModule],
})
export class AuthModule {}
