import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppApplicationModule } from '@application/modules/app/AppApplicationModule';
import { AuthModule } from '@application/modules/auth/AuthModule';
import { PermissionModule } from '@application/modules/permission/PermissionModule';
import { RoleModule } from '@application/modules/role/RoleModule';
import { RolePermissionModule } from '@application/modules/rolepermission/RolePermissionModule';
import { UserModule } from '@application/modules/user/UserModule';
import { UserPermissionModule } from '@application/modules/userpermission/UserPermissionModule';
import { AppController } from './controllers/AppController';
import { AuthController } from './controllers/AuthController';
import { PermissionController } from './controllers/PermissionController';
import { RoleController } from './controllers/RoleController';
import { RolePermissionController } from './controllers/RolePermissionController';
import { UserController } from './controllers/UserController';
import { UserPermissionController } from './controllers/UserPermissionController';
import { DomainExceptionFilter } from './filters/DomainExceptionFilter';
import { JwtAuthGuard } from './guards/JwtAuthGuard';
import { PermissionsGuard } from './guards/PermissionsGuard';
import { RequestLoggerMiddleware } from './middleware/RequestLoggerMiddleware';

@Module({
  imports: [
    AppApplicationModule,
    AuthModule,
    PermissionModule,
    RoleModule,
    RolePermissionModule,
    UserModule,
    UserPermissionModule,
  ],
  controllers: [
    AppController,
    AuthController,
    PermissionController,
    RoleController,
    RolePermissionController,
    UserController,
    UserPermissionController,
  ],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    // Order matters: authenticate first, then authorize. Both are global so a
    // new route is protected by default — per-route opt-in fails open.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
