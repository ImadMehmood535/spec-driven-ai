import { User } from '@domain/aggregates/UserAggregate/User';
import { IUserRepository } from '@infrastructure/repositories/abstraction/IUserRepository';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { IPasswordHasher } from '@shared/security/IPasswordHasher';
import { ChangePasswordCommand } from './ChangePasswordCommand';
import { ChangePasswordCommandHandler } from './ChangePasswordCommandHandler';

const OLD_HASH = '$2b$12$oldplaceholderoldplaceholderoldplaceholder';
const NEW_HASH = '$2b$12$newplaceholdernewplaceholdernewplaceholder';
const NEW_PLAINTEXT = 'a-new-real-password';

describe('ChangePasswordCommandHandler (D-9)', () => {
  let users: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let handler: ChangePasswordCommandHandler;

  beforeEach(() => {
    users = {
      save: jest.fn(),
      updateUser: jest.fn(),
      findById: jest
        .fn()
        .mockResolvedValue(
          User.rehydrate(
            1,
            'ahmed@example.com',
            'ahmed',
            'Ahmed',
            'Khan',
            OLD_HASH,
            null,
            EntityStatus.Active,
          ),
        ),
      emailExists: jest.fn(),
      usernameExists: jest.fn(),
    };
    hasher = { hash: jest.fn().mockResolvedValue(NEW_HASH), verify: jest.fn() };
    handler = new ChangePasswordCommandHandler(users, hasher);
  });

  it('hashes the new password and stores the hash', async () => {
    await handler.execute(new ChangePasswordCommand(1, NEW_PLAINTEXT));

    expect(hasher.hash).toHaveBeenCalledWith(NEW_PLAINTEXT);
    expect(users.updateUser.mock.calls[0][0].passwordHash).toBe(NEW_HASH);
  });

  it('does not require the current password — administrator action, not a reset (D-9)', async () => {
    // The command carries only a user id and the new password.
    const command = new ChangePasswordCommand(1, NEW_PLAINTEXT);

    expect(Object.keys(command)).toEqual(['userId', 'newPassword']);
    await expect(handler.execute(command)).resolves.toBeDefined();
  });

  it('returns confirmation carrying no password material', async () => {
    const response = await handler.execute(
      new ChangePasswordCommand(1, NEW_PLAINTEXT),
    );

    expect(response).toEqual({ userId: 1, passwordChanged: true });
    const serialised = JSON.stringify(response);
    expect(serialised).not.toContain(NEW_PLAINTEXT);
    expect(serialised).not.toContain(NEW_HASH);
  });

  it('rejects a password shorter than 8 characters', async () => {
    await expect(
      handler.execute(new ChangePasswordCommand(1, 'short')),
    ).rejects.toThrow(DomainError);
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it('404s when the user does not exist', async () => {
    users.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ChangePasswordCommand(99, NEW_PLAINTEXT)),
    ).rejects.toThrow(NotFoundError);
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it('leaves every other field untouched', async () => {
    await handler.execute(new ChangePasswordCommand(1, NEW_PLAINTEXT));

    const updated = users.updateUser.mock.calls[0][0];
    expect(updated.email).toBe('ahmed@example.com');
    expect(updated.username).toBe('ahmed');
    expect(updated.entityStatus).toBe(EntityStatus.Active);
  });
});
