import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppApplicationModule } from '@application/modules/app/AppApplicationModule';
import { PermissionModule } from '@application/modules/permission/PermissionModule';
import { AppController } from './controllers/AppController';
import { PermissionController } from './controllers/PermissionController';
import { DomainExceptionFilter } from './filters/DomainExceptionFilter';
import { RequestLoggerMiddleware } from './middleware/RequestLoggerMiddleware';

@Module({
  imports: [AppApplicationModule, PermissionModule],
  controllers: [AppController, PermissionController],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
