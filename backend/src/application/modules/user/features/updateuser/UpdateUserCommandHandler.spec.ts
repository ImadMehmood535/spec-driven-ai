import { User } from '@domain/aggregates/UserAggregate/User';
import { IUserRepository } from '@infrastructure/repositories/abstraction/IUserRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { UpdateUserCommand } from './UpdateUserCommand';
import { UpdateUserCommandHandler } from './UpdateUserCommandHandler';

const HASH = '$2b$12$placeholderplaceholderplaceholderplaceholder';

describe('UpdateUserCommandHandler', () => {
  let users: jest.Mocked<IUserRepository>;
  let handler: UpdateUserCommandHandler;

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
            HASH,
            null,
            EntityStatus.Active,
          ),
        ),
      emailExists: jest.fn().mockResolvedValue(false),
      usernameExists: jest.fn().mockResolvedValue(false),
    };
    handler = new UpdateUserCommandHandler(users);
  });

  it('404s when the user is absent', async () => {
    users.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateUserCommand(1, 'x@y.z')),
    ).rejects.toThrow(NotFoundError);
  });

  it('updates only the fields supplied', async () => {
    const response = await handler.execute(
      new UpdateUserCommand(1, undefined, undefined, 'Ahmad'),
    );

    expect(response.firstName).toBe('Ahmad');
    expect(response.lastName).toBe('Khan');
    expect(response.email).toBe('ahmed@example.com');
  });

  it('deactivates a user (FR-U4)', async () => {
    const response = await handler.execute(
      new UpdateUserCommand(
        1,
        undefined,
        undefined,
        undefined,
        undefined,
        EntityStatus.Inactive,
      ),
    );

    expect(response.entityStatus).toBe(EntityStatus.Inactive);
  });

  it('409s on a duplicate email, excluding itself from the check', async () => {
    users.emailExists.mockResolvedValue(true);

    await expect(
      handler.execute(new UpdateUserCommand(1, 'taken@example.com')),
    ).rejects.toThrow(ConflictError);
    expect(users.emailExists).toHaveBeenCalledWith('taken@example.com', 1);
  });

  it('409s on a duplicate username', async () => {
    users.usernameExists.mockResolvedValue(true);

    await expect(
      handler.execute(new UpdateUserCommand(1, undefined, 'taken')),
    ).rejects.toThrow('A user with that username already exists.');
  });

  it('rejects an invalid email through the aggregate', async () => {
    await expect(
      handler.execute(new UpdateUserCommand(1, 'not-an-email')),
    ).rejects.toThrow('User email is invalid.');
  });

  it('never alters the password hash', async () => {
    await handler.execute(
      new UpdateUserCommand(1, undefined, undefined, 'Ahmad'),
    );

    expect(users.updateUser.mock.calls[0][0].passwordHash).toBe(HASH);
  });

  it('returns no password material', async () => {
    const response = await handler.execute(
      new UpdateUserCommand(1, undefined, undefined, 'Ahmad'),
    );

    expect(JSON.stringify(response)).not.toContain(HASH);
    expect(Object.keys(response)).not.toContain('passwordHash');
  });
});
