import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';
import { AuthenticatedRequest } from './AuthenticatedRequest';
import { JwtAuthGuard } from './JwtAuthGuard';

const contextWith = (
  request: Partial<AuthenticatedRequest>,
): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard (FR-AC5)', () => {
  let jwt: { verifyAsync: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'uid-1',
        username: 'ahmed',
        role: 'Developer Admin',
        permissions: ['user.view'],
      }),
    };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new JwtAuthGuard(
      jwt as unknown as JwtService,
      reflector as unknown as Reflector,
    );
  });

  it('allows a valid bearer token and attaches the claims', async () => {
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer a.valid.token' },
    };

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.claims?.username).toBe('ahmed');
  });

  it('rejects a request with no Authorization header', async () => {
    await expect(
      guard.canActivate(contextWith({ headers: {} })),
    ).rejects.toThrow(UnauthorizedError);
  });

  it.each([
    ['a.valid.token', 'no scheme'],
    ['Basic abc', 'wrong scheme'],
    ['Bearer', 'no token'],
    ['Bearer   ', 'blank token'],
  ])('rejects a malformed header (%p — %s)', async (authorization) => {
    await expect(
      guard.canActivate(contextWith({ headers: { authorization } })),
    ).rejects.toThrow(UnauthorizedError);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an expired or invalid token', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(
      guard.canActivate(
        contextWith({ headers: { authorization: 'Bearer expired.token' } }),
      ),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('gives the same message whatever the reason, leaking nothing', async () => {
    const messages: string[] = [];

    await guard
      .canActivate(contextWith({ headers: {} }))
      .catch((e: Error) => messages.push(e.message));

    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    await guard
      .canActivate(contextWith({ headers: { authorization: 'Bearer x.y.z' } }))
      .catch((e: Error) => messages.push(e.message));

    expect(new Set(messages).size).toBe(1);
  });

  it('lets a @Public() route through without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(contextWith({ headers: {} }))).resolves.toBe(
      true,
    );
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('accepts a lowercase bearer scheme', async () => {
    await expect(
      guard.canActivate(
        contextWith({ headers: { authorization: 'bearer a.valid.token' } }),
      ),
    ).resolves.toBe(true);
  });
});
