import { Module } from '@nestjs/common';
import { AppService } from './AppService';

@Module({
  providers: [AppService],
  exports: [AppService],
})
export class AppApplicationModule {}
