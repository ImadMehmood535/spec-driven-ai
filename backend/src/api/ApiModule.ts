import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppApplicationModule } from '@application/modules/app/AppApplicationModule';
import { AppController } from './controllers/AppController';
import { DomainExceptionFilter } from './filters/DomainExceptionFilter';
import { RequestLoggerMiddleware } from './middleware/RequestLoggerMiddleware';

@Module({
  imports: [AppApplicationModule],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
