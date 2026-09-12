import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '@shared/errors/ForbiddenError';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';
import { AuthenticatedRequest } from './AuthenticatedRequest';
import { PermissionsGuard } from './PermissionsGuard';

const claims = (permissions: string[]) => ({
  sub: 'uid-1',
  username: 'ahmed',
  role: 'Developer Admin',
  permissions,
});

const contextWith = (
  request: Partial<AuthenticatedRequest>,
): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('PermissionsGuard (FR-AC6, FR-AC7)', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: PermissionsGuard;

  /** isPublic, then requiredPermission — the order the guard reads them. */
  const metadata = (isPublic: boolean, required?: string) => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(isPublic)
      .mockReturnValueOnce(required);
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new PermissionsGuard(reflector as unknown as Reflector);
  });

  it('allows a caller holding the required permission', () => {
    metadata(false, 'user.view');

    expect(
      guard.canActivate(contextWith({ claims: claims(['user.view']) })),
    ).toBe(true);
  });

  it('refuses a caller without it — 403, not 401 (FR-AC7)', () => {
    metadata(false, 'user.create');

    expect(() =>
      guard.canActivate(contextWith({ claims: claims(['user.view']) })),
    ).toThrow(ForbiddenError);
  });

  it('names the missing permission, so an operator can grant it', () => {
    metadata(false, 'user.create');

    expect(() =>
      guard.canActivate(contextWith({ claims: claims([]) })),
    ).toThrow('requires the "user.create" permission');
  });

  it('DEFAULT DENY: refuses a route that declares no permission', () => {
    // The most important case here. A route added without a decorator must
    // fail closed, not be reachable by any authenticated caller.
    metadata(false, undefined);

    expect(() =>
      guard.canActivate(contextWith({ claims: claims(['user.view']) })),
    ).toThrow(ForbiddenError);
  });

  it('default-deny applies even to a caller holding every permission', () => {
    metadata(false, undefined);

    expect(() =>
      guard.canActivate(
        contextWith({ claims: claims(['user.view', 'user.create']) }),
      ),
    ).toThrow(ForbiddenError);
  });

  it('allows a @Public() route with no claims at all', () => {
    metadata(true, undefined);

    expect(guard.canActivate(contextWith({}))).toBe(true);
  });

  it('401s when claims are absent on a guarded route (misordered guards)', () => {
    metadata(false, 'user.view');

    expect(() => guard.canActivate(contextWith({}))).toThrow(UnauthorizedError);
  });

  it('matches the permission exactly', () => {
    metadata(false, 'user.view');

    expect(() =>
      guard.canActivate(contextWith({ claims: claims(['user']) })),
    ).toThrow(ForbiddenError);
  });

  it('tolerates claims with no permissions array', () => {
    metadata(false, 'user.view');
    const request = {
      claims: { sub: 'uid-1', username: 'a', role: null },
    } as unknown as Partial<AuthenticatedRequest>;

    expect(() => guard.canActivate(contextWith(request))).toThrow(
      ForbiddenError,
    );
  });
});
