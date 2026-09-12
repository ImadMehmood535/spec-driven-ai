import { Role } from '@domain/aggregates/RoleAggregate/Role';
import { User } from '@domain/aggregates/UserAggregate/User';
import { IRoleRepository } from '@infrastructure/repositories/abstraction/IRoleRepository';
import { IUserRepository } from '@infrastructure/repositories/abstraction/IUserRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { IPasswordHasher } from '@shared/security/IPasswordHasher';
import { CreateUserCommand } from './CreateUserCommand';
import { CreateUserCommandHandler } from './CreateUserCommandHandler';

const PLAINTEXT = 'a-real-enough-password';
const HASH = '$2b$12$placeholderplaceholderplaceholderplaceholder';

describe('CreateUserCommandHandler', () => {
  let users: jest.Mocked<IUserRepository>;
  let roles: jest.Mocked<IRoleRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let handler: CreateUserCommandHandler;

  const command = (overrides: Partial<CreateUserCommand> = {}) =>
    new CreateUserCommand(
      overrides.email ?? 'ahmed@example.com',
      overrides.username ?? 'ahmed',
      overrides.firstName ?? 'Ahmed',
      overrides.lastName ?? 'Khan',
      overrides.password ?? PLAINTEXT,
      overrides.roleId ?? null,
    );

  beforeEach(() => {
    users = {
      save: jest
        .fn()
        .mockImplementation((user: User) =>
          Promise.resolve(
            User.rehydrate(
              1,
              user.email,
              user.username,
              user.firstName,
              user.lastName,
              user.passwordHash,
              user.roleId,
              EntityStatus.Active,
            ),
          ),
        ),
      updateUser: jest.fn(),
      findById: jest.fn(),
      emailExists: jest.fn().mockResolvedValue(false),
      usernameExists: jest.fn().mockResolvedValue(false),
    };
    roles = {
      save: jest.fn(),
      updateRole: jest.fn(),
      findById: jest
        .fn()
        .mockResolvedValue(
          Role.rehydrate(1, 'Developer Admin', null, EntityStatus.Active),
        ),
      nameExists: jest.fn(),
    };
    hasher = {
      hash: jest.fn().mockResolvedValue(HASH),
      verify: jest.fn(),
    };
    handler = new CreateUserCommandHandler(users, roles, hasher);
  });

  it('hashes the password before saving', async () => {
    await handler.execute(command());

    expect(hasher.hash).toHaveBeenCalledWith(PLAINTEXT);
    const saved = users.save.mock.calls[0][0];
    expect(saved.passwordHash).toBe(HASH);
  });

  it('never persists the plaintext password', async () => {
    await handler.execute(command());

    const saved = users.save.mock.calls[0][0];
    expect(JSON.stringify(saved)).not.toContain(PLAINTEXT);
  });

  it('returns no password material at all (NFR-3)', async () => {
    const response = await handler.execute(command());

    const serialised = JSON.stringify(response);
    expect(serialised).not.toContain(PLAINTEXT);
    expect(serialised).not.toContain(HASH);
    expect(Object.keys(response)).not.toContain('passwordHash');
    expect(Object.keys(response)).not.toContain('password');
  });

  it('rejects a password shorter than 8 characters', async () => {
    await expect(
      handler.execute(command({ password: 'short' })),
    ).rejects.toThrow(DomainError);
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it('409s on a duplicate email', async () => {
    users.emailExists.mockResolvedValue(true);

    await expect(handler.execute(command())).rejects.toThrow(ConflictError);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('409s on a duplicate username', async () => {
    users.usernameExists.mockResolvedValue(true);

    await expect(handler.execute(command())).rejects.toThrow(
      'A user with that username already exists.',
    );
  });

  it('does not hash before uniqueness is settled, avoiding wasted work', async () => {
    users.emailExists.mockResolvedValue(true);

    await expect(handler.execute(command())).rejects.toThrow(ConflictError);
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it('404s when the requested role does not exist', async () => {
    roles.findById.mockResolvedValue(null);

    await expect(handler.execute(command({ roleId: 99 }))).rejects.toThrow(
      NotFoundError,
    );
    expect(users.save).not.toHaveBeenCalled();
  });

  it('allows creating a user with no role (FR-AC4)', async () => {
    const response = await handler.execute(command({ roleId: null }));

    expect(response.roleId).toBeNull();
    expect(roles.findById).not.toHaveBeenCalled();
  });
});
