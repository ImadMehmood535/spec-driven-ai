import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTag } from '@api/common/ApiConstants';
import { CheckUserPermissionQuery } from '@application/modules/userpermission/features/checkuserpermission/CheckUserPermissionQuery';
import { CheckUserPermissionResponse } from '@application/modules/userpermission/features/checkuserpermission/CheckUserPermissionResponse';
import { GetUserPermissionsQuery } from '@application/modules/userpermission/features/getuserpermissions/GetUserPermissionsQuery';
import { GetUserPermissionsResponse } from '@application/modules/userpermission/features/getuserpermissions/GetUserPermissionsResponse';

/**
 * The capability other Developer platform modules consume (§9.6).
 */
@ApiTags(SwaggerTag.User)
@Controller('user/:userId/permission')
export class UserPermissionController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({
    summary: "Resolve a user's effective permissions through their role",
  })
  @ApiResponse({ status: 200, type: GetUserPermissionsResponse })
  @ApiResponse({ status: 404, description: 'User was not found' })
  getPermissions(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GetUserPermissionsResponse> {
    return this.queryBus.execute<
      GetUserPermissionsQuery,
      GetUserPermissionsResponse
    >(new GetUserPermissionsQuery(userId));
  }

  @Get('check')
  @ApiOperation({
    summary: 'Determine whether a user may perform an action (§9.6)',
  })
  @ApiQuery({ name: 'name', required: true, example: 'project.create' })
  @ApiResponse({ status: 200, type: CheckUserPermissionResponse })
  @ApiResponse({ status: 400, description: 'Permission name is required' })
  @ApiResponse({ status: 404, description: 'User was not found' })
  checkPermission(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('name') name: string,
  ): Promise<CheckUserPermissionResponse> {
    return this.queryBus.execute<
      CheckUserPermissionQuery,
      CheckUserPermissionResponse
    >(new CheckUserPermissionQuery(userId, name));
  }
}
