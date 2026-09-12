import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC } from '@api/decorators/Public';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';
import { AuthenticatedRequest, TokenClaims } from './AuthenticatedRequest';

/**
 * Verifies the bearer token on every route except those marked `@Public()`
 * (FR-AC5). Registered globally so a new route is authenticated by default —
 * per-route opt-in would fail open the moment someone forgot the decorator.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedError('Authentication is required.');
    }

    try {
      // Absent, malformed and expired tokens all land here with the same
      // message — the reason is not the caller's business.
      request.claims = await this.jwtService.verifyAsync<TokenClaims>(token);
    } catch {
      throw new UnauthorizedError('Authentication is required.');
    }

    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | null {
    const header = request.headers?.authorization;
    const value = Array.isArray(header) ? header[0] : header;

    if (!value || typeof value !== 'string') {
      return null;
    }

    const [scheme, token] = value.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token.trim();
  }
}
