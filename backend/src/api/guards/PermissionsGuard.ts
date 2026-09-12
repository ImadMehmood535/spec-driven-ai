import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from '@api/decorators/Public';
import { REQUIRED_PERMISSION } from '@api/decorators/RequiresPermission';
import { ForbiddenError } from '@shared/errors/ForbiddenError';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';
import { AuthenticatedRequest } from './AuthenticatedRequest';

/**
 * Enforces the permission a route declares (FR-AC6), read from the token's
 * claims — the same set the shared resolution query produced at login, so
 * enforcement cannot drift from what was granted.
 *
 * **Default deny**: a route with neither `@RequiresPermission()` nor
 * `@Public()` is refused. An omission must fail closed; the alternative is a
 * new route silently reachable by any authenticated caller.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRED_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      throw new ForbiddenError(
        'This route declares no required permission and is therefore refused.',
      );
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const claims = request.claims;

    if (!claims) {
      // JwtAuthGuard runs first, so this means the guards were misordered.
      throw new UnauthorizedError('Authentication is required.');
    }

    if (!claims.permissions?.includes(required)) {
      throw new ForbiddenError(
        `This action requires the "${required}" permission.`,
      );
    }

    return true;
  }
}
