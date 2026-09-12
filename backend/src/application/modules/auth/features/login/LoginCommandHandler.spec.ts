import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuthUserReadModel,
  IAuthQueries,
} from '@infrastructure/queries/abstraction/IAuthQueries';
import { IUserPermissionQueries } from '@infrastructure/queries/abstraction/IUserPermissionQueries';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';
import { IPasswordHasher } from '@shared/security/IPasswordHasher';
import { LoginCommand } from './LoginCommand';
import { LoginCommandHandler } from './LoginCommandHandler';

const PLAINTEXT = 'a-real-password';
const HASH = '$2b$12$placeholderplaceholderplaceholderplaceholder';

const authUser = (
  overrides: Partial<AuthUserReadModel> = {},
): AuthUserReadModel => ({
  id: 1,
  globalUId: 'uid-1',
  username: 'ahmed',
  passwordHash: HASH,
  entityStatus: EntityStatus.Active,
  roleName: 'Developer Admin',
  ...overrides,
});

describe('LoginCommandHandler', () => {
  let auth: jest.Mocked<IAuthQueries>;
  let permissions: jest.Mocked<IUserPermissionQueries>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };
  let handler: LoginCommandHandler;

  beforeEach(() => {
    auth = { findByIdentifier: jest.fn().mockResolvedValue(authUser()) };
    permissions = {
      findEffectivePermissionNames: jest
        .fn()
        .mockResolvedValue(['project.create']),
      userExists: jest.fn(),
    };
    hasher = { hash: jest.fn(), verify: jest.fn().mockResolvedValue(true) };
    jwt = { signAsync: jest.fn().mockResolvedValue('a.signed.token') };
    config = { get: jest.fn().mockReturnValue('1h') };
    handler = new LoginCommandHandler(
      auth,
      permissions,
      hasher,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  const signedClaims = (): Record<string, unknown> => {
    const calls = jwt.signAsync.mock.calls as unknown[][];
    return calls[0][0] as Record<string, unknown>;
  };

  const login = (identifier = 'ahmed@example.com', password = PLAINTEXT) =>
    handler.execute(new LoginCommand(identifier, password));

  it('issues a token for correct credentials (FR-U6)', async () => {
    const response = await login();

    expect(response).toEqual({
      accessToken: 'a.signed.token',
      expiresIn: '1h',
    });
  });

  it('signs the claims D-2 specifies', async () => {
    await login();

    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 'uid-1',
      username: 'ahmed',
      role: 'Developer Admin',
      permissions: ['project.create'],
    });
  });

  it('takes permission claims from the shared resolution, so FR-AC3 applies to the token', async () => {
    permissions.findEffectivePermissionNames.mockResolvedValue([]);

    await login();

    const claims = signedClaims() as { permissions: string[] };
    expect(claims.permissions).toEqual([]);
  });

  it('omits the role when the user has none (FR-AC4)', async () => {
    auth.findByIdentifier.mockResolvedValue(authUser({ roleName: null }));

    await login();

    const claims = signedClaims() as { role: string | null };
    expect(claims.role).toBeNull();
  });

  it('never puts credential material in the claims', async () => {
    await login();

    const serialised = JSON.stringify(signedClaims());
    expect(serialised).not.toContain(HASH);
    expect(serialised).not.toContain(PLAINTEXT);
  });

  it('rejects a wrong password with 401', async () => {
    hasher.verify.mockResolvedValue(false);

    await expect(login()).rejects.toThrow(UnauthorizedError);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an unknown user with 401', async () => {
    auth.findByIdentifier.mockResolvedValue(null);

    await expect(login()).rejects.toThrow(UnauthorizedError);
  });

  it('rejects a deactivated user even with the right password (FR-U7)', async () => {
    auth.findByIdentifier.mockResolvedValue(
      authUser({ entityStatus: EntityStatus.Inactive }),
    );

    await expect(login()).rejects.toThrow(UnauthorizedError);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('gives an IDENTICAL message for all three failures — no user enumeration', async () => {
    const messages: string[] = [];

    auth.findByIdentifier.mockResolvedValue(null);
    await login().catch((error: Error) => messages.push(error.message));

    auth.findByIdentifier.mockResolvedValue(authUser());
    hasher.verify.mockResolvedValue(false);
    await login().catch((error: Error) => messages.push(error.message));

    hasher.verify.mockResolvedValue(true);
    auth.findByIdentifier.mockResolvedValue(
      authUser({ entityStatus: EntityStatus.Inactive }),
    );
    await login().catch((error: Error) => messages.push(error.message));

    expect(messages).toHaveLength(3);
    expect(new Set(messages).size).toBe(1);
    expect(messages[0]).toBe('Invalid credentials.');
  });

  it('still performs a hash verification when no user was found, for timing parity', async () => {
    auth.findByIdentifier.mockResolvedValue(null);

    await login().catch(() => undefined);

    // Without this, response time would reveal whether an account exists.
    expect(hasher.verify).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['', PLAINTEXT],
    ['ahmed', ''],
    ['   ', PLAINTEXT],
  ])('rejects blank input (%p, %p) without a lookup', async (id, password) => {
    await expect(login(id, password)).rejects.toThrow(UnauthorizedError);
    expect(auth.findByIdentifier).not.toHaveBeenCalled();
  });

  it('does not resolve permissions until the credentials pass', async () => {
    hasher.verify.mockResolvedValue(false);

    await login().catch(() => undefined);

    expect(permissions.findEffectivePermissionNames).not.toHaveBeenCalled();
  });
});
