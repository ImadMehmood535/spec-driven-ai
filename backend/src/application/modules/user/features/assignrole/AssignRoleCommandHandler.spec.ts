import { Role } from '@domain/aggregates/RoleAggregate/Role';
import { User } from '@domain/aggregates/UserAggregate/User';
import { IRoleRepository } from '@infrastructure/repositories/abstraction/IRoleRepository';
import { IUserRepository } from '@infrastructure/repositories/abstraction/IUserRepository';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { AssignRoleCommand } from './AssignRoleCommand';
import { AssignRoleCommandHandler } from './AssignRoleCommandHandler';

const HASH = '$2b$12$placeholderplaceholderplaceholderplaceholder';

const userWithRole = (roleId: number | null) =>
  User.rehydrate(
    1,
    'ahmed@example.com',
    'ahmed',
    'Ahmed',
    'Khan',
    HASH,
    roleId,
    EntityStatus.Active,
  );

describe('AssignRoleCommandHandler', () => {
  let users: jest.Mocked<IUserRepository>;
  let roles: jest.Mocked<IRoleRepository>;
  let handler: AssignRoleCommandHandler;

  beforeEach(() => {
    users = {
      save: jest.fn(),
      updateUser: jest.fn(),
      findById: jest.fn().mockResolvedValue(userWithRole(null)),
      emailExists: jest.fn(),
      usernameExists: jest.fn(),
    };
    roles = {
      save: jest.fn(),
      updateRole: jest.fn(),
      findById: jest
        .fn()
        .mockResolvedValue(
          Role.rehydrate(2, 'Developer Admin', null, EntityStatus.Active),
        ),
      nameExists: jest.fn(),
    };
    handler = new AssignRoleCommandHandler(users, roles);
  });

  it('assigns a role to a user with none', async () => {
    const response = await handler.execute(new AssignRoleCommand(1, 2));

    expect(response).toEqual({ userId: 1, roleId: 2 });
    expect(users.updateUser).toHaveBeenCalledTimes(1);
  });

  it('REPLACES an existing role rather than accumulating (§6)', async () => {
    users.findById.mockResolvedValue(userWithRole(1));

    const response = await handler.execute(new AssignRoleCommand(1, 2));

    expect(response.roleId).toBe(2);
    const updated = users.updateUser.mock.calls[0][0];
    expect(updated.roleId).toBe(2);
    // A single scalar, never a collection — multi-role is out of scope.
    expect(Array.isArray(updated.roleId)).toBe(false);
  });

  it('clears a role when null is assigned (FR-AC4)', async () => {
    users.findById.mockResolvedValue(userWithRole(1));

    const response = await handler.execute(new AssignRoleCommand(1, null));

    expect(response.roleId).toBeNull();
    expect(roles.findById).not.toHaveBeenCalled();
  });

  it('404s when the user does not exist', async () => {
    users.findById.mockResolvedValue(null);

    await expect(handler.execute(new AssignRoleCommand(99, 2))).rejects.toThrow(
      'User was not found.',
    );
  });

  it('404s when the role does not exist', async () => {
    roles.findById.mockResolvedValue(null);

    await expect(handler.execute(new AssignRoleCommand(1, 99))).rejects.toThrow(
      'Role was not found.',
    );
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it('leaves the password hash untouched', async () => {
    await handler.execute(new AssignRoleCommand(1, 2));

    expect(users.updateUser.mock.calls[0][0].passwordHash).toBe(HASH);
  });
});
