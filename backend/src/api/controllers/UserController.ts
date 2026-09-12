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
import { AssignRoleCommand } from '@application/modules/user/features/assignrole/AssignRoleCommand';
import { AssignRoleRequest } from '@application/modules/user/features/assignrole/AssignRoleRequest';
import { AssignRoleResponse } from '@application/modules/user/features/assignrole/AssignRoleResponse';
import { ChangePasswordCommand } from '@application/modules/user/features/changepassword/ChangePasswordCommand';
import { ChangePasswordRequest } from '@application/modules/user/features/changepassword/ChangePasswordRequest';
import { ChangePasswordResponse } from '@application/modules/user/features/changepassword/ChangePasswordResponse';
import { CreateUserCommand } from '@application/modules/user/features/createuser/CreateUserCommand';
import { CreateUserRequest } from '@application/modules/user/features/createuser/CreateUserRequest';
import { CreateUserResponse } from '@application/modules/user/features/createuser/CreateUserResponse';
import { GetUserQuery } from '@application/modules/user/features/getuser/GetUserQuery';
import { GetUserResponse } from '@application/modules/user/features/getuser/GetUserResponse';
import { GetUsersQuery } from '@application/modules/user/features/getusers/GetUsersQuery';
import { GetUsersResponse } from '@application/modules/user/features/getusers/GetUsersResponse';
import { UpdateUserCommand } from '@application/modules/user/features/updateuser/UpdateUserCommand';
import { UpdateUserRequest } from '@application/modules/user/features/updateuser/UpdateUserRequest';
import { UpdateUserResponse } from '@application/modules/user/features/updateuser/UpdateUserResponse';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { resolvePage, resolvePageSize } from '@shared/utils/Pagination';

@ApiTags(SwaggerTag.User)
@Controller(ApiRoute.User)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, type: CreateUserResponse })
  @ApiResponse({ status: 400, description: 'A required field is invalid' })
  @ApiResponse({ status: 404, description: 'Role was not found' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  createUser(@Body() request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.commandBus.execute<CreateUserCommand, CreateUserResponse>(
      new CreateUserCommand(
        request.email,
        request.username,
        request.firstName,
        request.lastName,
        request.password,
        request.roleId ?? null,
      ),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List users (search, filter, paginate)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'entityStatus', required: false, enum: EntityStatus })
  @ApiQuery({ name: 'roleId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiResponse({ status: 200, type: GetUsersResponse })
  findAll(
    @Query('search') search?: string,
    @Query('entityStatus') entityStatus?: string,
    @Query('roleId') roleId?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ): Promise<GetUsersResponse> {
    const parsedRoleId = Number(roleId);
    return this.queryBus.execute<GetUsersQuery, GetUsersResponse>(
      new GetUsersQuery({
        search,
        entityStatus,
        roleId:
          Number.isInteger(parsedRoleId) && parsedRoleId > 0
            ? parsedRoleId
            : undefined,
        page: resolvePage(page),
        size: resolvePageSize(size),
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, type: GetUserResponse })
  @ApiResponse({ status: 404, description: 'User was not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<GetUserResponse> {
    return this.queryBus.execute<GetUserQuery, GetUserResponse>(
      new GetUserQuery(id),
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Partially update a user, including activate/deactivate',
  })
  @ApiResponse({ status: 200, type: UpdateUserResponse })
  @ApiResponse({ status: 404, description: 'User was not found' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateUserRequest,
  ): Promise<UpdateUserResponse> {
    return this.commandBus.execute<UpdateUserCommand, UpdateUserResponse>(
      new UpdateUserCommand(
        id,
        request.email,
        request.username,
        request.firstName,
        request.lastName,
        request.entityStatus,
      ),
    );
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Assign a role to a user, replacing any existing one (§6)',
  })
  @ApiResponse({ status: 200, type: AssignRoleResponse })
  @ApiResponse({ status: 404, description: 'User or role was not found' })
  assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: AssignRoleRequest,
  ): Promise<AssignRoleResponse> {
    return this.commandBus.execute<AssignRoleCommand, AssignRoleResponse>(
      new AssignRoleCommand(id, request.roleId ?? null),
    );
  }

  /**
   * An administrator setting a password for a user (D-9). Separate from the
   * general update so a credential never arrives in a general-purpose body.
   * Not a reset flow — no token, no current-password challenge.
   */
  @Patch(':id/password')
  @ApiOperation({ summary: "Change a user's password (administrator action)" })
  @ApiResponse({ status: 200, type: ChangePasswordResponse })
  @ApiResponse({ status: 400, description: 'Password too short' })
  @ApiResponse({ status: 404, description: 'User was not found' })
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> {
    return this.commandBus.execute<
      ChangePasswordCommand,
      ChangePasswordResponse
    >(new ChangePasswordCommand(id, request.newPassword));
  }

  // No delete route: D-5 — deactivation via PATCH is the only retirement path.
}
