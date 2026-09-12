import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiRoute, SwaggerTag } from '@api/common/ApiConstants';
import { CreatePermissionCommand } from '@application/modules/permission/features/createpermission/CreatePermissionCommand';
import { CreatePermissionRequest } from '@application/modules/permission/features/createpermission/CreatePermissionRequest';
import { CreatePermissionResponse } from '@application/modules/permission/features/createpermission/CreatePermissionResponse';
import { GetPermissionQuery } from '@application/modules/permission/features/getpermission/GetPermissionQuery';
import { GetPermissionResponse } from '@application/modules/permission/features/getpermission/GetPermissionResponse';
import { GetPermissionsQuery } from '@application/modules/permission/features/getpermissions/GetPermissionsQuery';
import { GetPermissionsResponse } from '@application/modules/permission/features/getpermissions/GetPermissionsResponse';
import { UpdatePermissionCommand } from '@application/modules/permission/features/updatepermission/UpdatePermissionCommand';
import { UpdatePermissionRequest } from '@application/modules/permission/features/updatepermission/UpdatePermissionRequest';
import { UpdatePermissionResponse } from '@application/modules/permission/features/updatepermission/UpdatePermissionResponse';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { resolvePage, resolvePageSize } from '@shared/utils/Pagination';

@ApiTags(SwaggerTag.Permission)
@Controller(ApiRoute.Permission)
export class PermissionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a permission' })
  @ApiResponse({ status: 201, type: CreatePermissionResponse })
  @ApiResponse({ status: 400, description: 'A required field is invalid' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  createPermission(
    @Body() request: CreatePermissionRequest,
  ): Promise<CreatePermissionResponse> {
    return this.commandBus.execute<
      CreatePermissionCommand,
      CreatePermissionResponse
    >(new CreatePermissionCommand(request.name, request.description ?? null));
  }

  @Get()
  @ApiOperation({ summary: 'List permissions (search, filter, paginate)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'entityStatus', required: false, enum: EntityStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiResponse({ status: 200, type: GetPermissionsResponse })
  findAll(
    @Query('search') search?: string,
    @Query('entityStatus') entityStatus?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ): Promise<GetPermissionsResponse> {
    return this.queryBus.execute<GetPermissionsQuery, GetPermissionsResponse>(
      new GetPermissionsQuery({
        search,
        entityStatus,
        page: resolvePage(page),
        size: resolvePageSize(size),
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a permission by id' })
  @ApiResponse({ status: 200, type: GetPermissionResponse })
  @ApiResponse({ status: 404, description: 'Permission was not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetPermissionResponse> {
    return this.queryBus.execute<GetPermissionQuery, GetPermissionResponse>(
      new GetPermissionQuery(id),
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Partially update a permission, including activate/deactivate',
  })
  @ApiResponse({ status: 200, type: UpdatePermissionResponse })
  @ApiResponse({ status: 400, description: 'A field is invalid' })
  @ApiResponse({ status: 404, description: 'Permission was not found' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePermissionRequest,
  ): Promise<UpdatePermissionResponse> {
    return this.commandBus.execute<
      UpdatePermissionCommand,
      UpdatePermissionResponse
    >(
      new UpdatePermissionCommand(
        id,
        request.name,
        request.description,
        request.entityStatus,
      ),
    );
  }

  // No delete route: D-5 — deactivation via PATCH is the only retirement path.
}
