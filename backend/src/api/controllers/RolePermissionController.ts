import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTag } from '@api/common/ApiConstants';
import { AssignPermissionsCommand } from '@application/modules/rolepermission/features/assignpermissions/AssignPermissionsCommand';
import { AssignPermissionsRequest } from '@application/modules/rolepermission/features/assignpermissions/AssignPermissionsRequest';
import { AssignPermissionsResponse } from '@application/modules/rolepermission/features/assignpermissions/AssignPermissionsResponse';
import { GetRolePermissionsQuery } from '@application/modules/rolepermission/features/getrolepermissions/GetRolePermissionsQuery';
import { GetRolePermissionsResponse } from '@application/modules/rolepermission/features/getrolepermissions/GetRolePermissionsResponse';
import { RemovePermissionCommand } from '@application/modules/rolepermission/features/removepermission/RemovePermissionCommand';
import { RemovePermissionResponse } from '@application/modules/rolepermission/features/removepermission/RemovePermissionResponse';

/**
 * Role-scoped: every operation here is "this role's permissions".
 */
@ApiTags(SwaggerTag.Role)
@Controller('role/:roleId/permission')
export class RolePermissionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Assign one or more permissions to a role' })
  @ApiResponse({ status: 201, type: AssignPermissionsResponse })
  @ApiResponse({ status: 400, description: 'No permission ids supplied' })
  @ApiResponse({ status: 404, description: 'Role or permission was not found' })
  @ApiResponse({
    status: 409,
    description: 'One or more permissions are already assigned and active',
  })
  assignPermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() request: AssignPermissionsRequest,
  ): Promise<AssignPermissionsResponse> {
    return this.commandBus.execute<
      AssignPermissionsCommand,
      AssignPermissionsResponse
    >(new AssignPermissionsCommand(roleId, request.permissionIds ?? []));
  }

  @Get()
  @ApiOperation({ summary: "List a role's permissions" })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include links that were removed (deactivated)',
  })
  @ApiResponse({ status: 200, type: GetRolePermissionsResponse })
  @ApiResponse({ status: 404, description: 'Role was not found' })
  findByRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetRolePermissionsResponse> {
    return this.queryBus.execute<
      GetRolePermissionsQuery,
      GetRolePermissionsResponse
    >(new GetRolePermissionsQuery(roleId, includeInactive === 'true'));
  }

  /**
   * Removes a permission from a role by deactivating the link (D-8). This is a
   * relationship change, not an entity delete, so it does not conflict with
   * D-5 — the row survives and a later re-assignment reactivates it.
   */
  @Delete(':permissionId')
  @ApiOperation({
    summary: 'Remove a permission from a role (deactivates the link)',
  })
  @ApiResponse({ status: 200, type: RemovePermissionResponse })
  @ApiResponse({
    status: 404,
    description: 'That permission is not assigned to this role',
  })
  removePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ): Promise<RemovePermissionResponse> {
    return this.commandBus.execute<
      RemovePermissionCommand,
      RemovePermissionResponse
    >(new RemovePermissionCommand(roleId, permissionId));
  }
}
