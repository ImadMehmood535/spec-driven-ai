import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTag } from '@api/common/ApiConstants';
import { AppService, ServiceHealth } from '@application/modules/app/AppService';

@ApiTags(SwaggerTag.App)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Service health' })
  @ApiResponse({ status: 200, description: 'The service is running' })
  getHealth(): ServiceHealth {
    return this.appService.getHealth();
  }
}
