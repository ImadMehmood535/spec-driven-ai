import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppApplicationModule } from '@application/modules/app/AppApplicationModule';
import { PermissionModule } from '@application/modules/permission/PermissionModule';
import { RoleModule } from '@application/modules/role/RoleModule';
import { RolePermissionModule } from '@application/modules/rolepermission/RolePermissionModule';
import { AppController } from './controllers/AppController';
import { PermissionController } from './controllers/PermissionController';
import { RoleController } from './controllers/RoleController';
import { RolePermissionController } from './controllers/RolePermissionController';
import { DomainExceptionFilter } from './filters/DomainExceptionFilter';
import { RequestLoggerMiddleware } from './middleware/RequestLoggerMiddleware';

@Module({
  imports: [
    AppApplicationModule,
    PermissionModule,
    RoleModule,
    RolePermissionModule,
  ],
  controllers: [
    AppController,
    PermissionController,
    RoleController,
    RolePermissionController,
  ],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
