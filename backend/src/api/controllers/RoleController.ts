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
import { CreateRoleCommand } from '@application/modules/role/features/createrole/CreateRoleCommand';
import { CreateRoleRequest } from '@application/modules/role/features/createrole/CreateRoleRequest';
import { CreateRoleResponse } from '@application/modules/role/features/createrole/CreateRoleResponse';
import { GetRoleQuery } from '@application/modules/role/features/getrole/GetRoleQuery';
import { GetRoleResponse } from '@application/modules/role/features/getrole/GetRoleResponse';
import { GetRolesQuery } from '@application/modules/role/features/getroles/GetRolesQuery';
import { GetRolesResponse } from '@application/modules/role/features/getroles/GetRolesResponse';
import { UpdateRoleCommand } from '@application/modules/role/features/updaterole/UpdateRoleCommand';
import { UpdateRoleRequest } from '@application/modules/role/features/updaterole/UpdateRoleRequest';
import { UpdateRoleResponse } from '@application/modules/role/features/updaterole/UpdateRoleResponse';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { resolvePage, resolvePageSize } from '@shared/utils/Pagination';
import { RequiresPermission } from '@api/decorators/RequiresPermission';

@ApiTags(SwaggerTag.Role)
@Controller(ApiRoute.Role)
export class RoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @RequiresPermission('role.create')
  @Post()
  @ApiOperation({ summary: 'Create a role' })
  @ApiResponse({ status: 201, type: CreateRoleResponse })
  @ApiResponse({ status: 400, description: 'A required field is invalid' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  createRole(@Body() request: CreateRoleRequest): Promise<CreateRoleResponse> {
    return this.commandBus.execute<CreateRoleCommand, CreateRoleResponse>(
      new CreateRoleCommand(request.name, request.description ?? null),
    );
  }

  @RequiresPermission('role.view')
  @Get()
  @ApiOperation({ summary: 'List roles (search, filter, paginate)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'entityStatus', required: false, enum: EntityStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiResponse({ status: 200, type: GetRolesResponse })
  findAll(
    @Query('search') search?: string,
    @Query('entityStatus') entityStatus?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ): Promise<GetRolesResponse> {
    return this.queryBus.execute<GetRolesQuery, GetRolesResponse>(
      new GetRolesQuery({
        search,
        entityStatus,
        page: resolvePage(page),
        size: resolvePageSize(size),
      }),
    );
  }

  @RequiresPermission('role.view')
  @Get(':id')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiResponse({ status: 200, type: GetRoleResponse })
  @ApiResponse({ status: 404, description: 'Role was not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<GetRoleResponse> {
    return this.queryBus.execute<GetRoleQuery, GetRoleResponse>(
      new GetRoleQuery(id),
    );
  }

  @RequiresPermission('role.update')
  @Patch(':id')
  @ApiOperation({
    summary: 'Partially update a role, including activate/deactivate',
  })
  @ApiResponse({ status: 200, type: UpdateRoleResponse })
  @ApiResponse({ status: 400, description: 'A field is invalid' })
  @ApiResponse({ status: 404, description: 'Role was not found' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateRoleRequest,
  ): Promise<UpdateRoleResponse> {
    return this.commandBus.execute<UpdateRoleCommand, UpdateRoleResponse>(
      new UpdateRoleCommand(
        id,
        request.name,
        request.description,
        request.entityStatus,
      ),
    );
  }

  // No delete route: D-5 — deactivation via PATCH is the only retirement path.
}
