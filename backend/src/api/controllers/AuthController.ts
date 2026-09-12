import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginCommand } from '@application/modules/auth/features/login/LoginCommand';
import { LoginRequest } from '@application/modules/auth/features/login/LoginRequest';
import { LoginResponse } from '@application/modules/auth/features/login/LoginResponse';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive a JWT' })
  @ApiResponse({ status: 200, type: LoginResponse })
  @ApiResponse({
    status: 401,
    description:
      'Invalid credentials. Identical for an unknown user, a wrong password, and a deactivated account — no user enumeration.',
  })
  login(@Body() request: LoginRequest): Promise<LoginResponse> {
    return this.commandBus.execute<LoginCommand, LoginResponse>(
      new LoginCommand(request.identifier, request.password),
    );
  }
}
