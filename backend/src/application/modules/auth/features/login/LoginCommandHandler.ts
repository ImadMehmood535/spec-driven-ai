import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import {
  AUTH_QUERIES,
  IAuthQueries,
} from '@infrastructure/queries/abstraction/IAuthQueries';
import {
  IUserPermissionQueries,
  USER_PERMISSION_QUERIES,
} from '@infrastructure/queries/abstraction/IUserPermissionQueries';
import { DEFAULT_EXPIRES_IN } from '@infrastructure/security/JwtConfig';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '@shared/security/IPasswordHasher';
import { LoginCommand } from './LoginCommand';
import { LoginResponse } from './LoginResponse';

/**
 * One message for every failure. Distinguishing "unknown user" from "wrong
 * password" hands an attacker a user-enumeration oracle, so all three causes —
 * absent, wrong password, and deactivated (FR-U7) — produce this.
 */
const FAILURE_MESSAGE = 'Invalid credentials.';

/**
 * A real bcrypt hash of a value no one knows, used to spend the same time
 * verifying when no user was found. Without it, response time reveals whether
 * an account exists.
 */
const DUMMY_HASH =
  '$2b$12$C6UzMDM.H6dfI/f/IKcEe.Ie.CqLpqVXEgwLVa1cWIi9dGz5Hs2xa';

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<
  LoginCommand,
  LoginResponse
> {
  constructor(
    @Inject(AUTH_QUERIES)
    private readonly authQueries: IAuthQueries,
    @Inject(USER_PERMISSION_QUERIES)
    private readonly permissionQueries: IUserPermissionQueries,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponse> {
    const identifier = (command.identifier ?? '').trim();
    const password = command.password ?? '';

    if (identifier.length === 0 || password.length === 0) {
      throw new UnauthorizedError(FAILURE_MESSAGE);
    }

    const user = await this.authQueries.findByIdentifier(identifier);

    if (!user) {
      // Spend the same time as a real verification so absence is not
      // detectable by response time, then fail identically.
      await this.passwordHasher.verify(password, DUMMY_HASH);
      throw new UnauthorizedError(FAILURE_MESSAGE);
    }

    const passwordMatches = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedError(FAILURE_MESSAGE);
    }

    // FR-U7: a deactivated user cannot authenticate, and the response gives no
    // hint that the account exists.
    if (user.entityStatus !== EntityStatus.Active) {
      throw new UnauthorizedError(FAILURE_MESSAGE);
    }

    // Claims come from the same resolution used everywhere else, so every
    // FR-AC3 exclusion applies to the token.
    const permissions =
      await this.permissionQueries.findEffectivePermissionNames(user.id);

    const accessToken = await this.jwtService.signAsync({
      sub: user.globalUId,
      username: user.username,
      role: user.roleName,
      permissions,
    });

    return LoginResponse.of(
      accessToken,
      this.config.get<string>('JWT_EXPIRES_IN', DEFAULT_EXPIRES_IN),
    );
  }
}
