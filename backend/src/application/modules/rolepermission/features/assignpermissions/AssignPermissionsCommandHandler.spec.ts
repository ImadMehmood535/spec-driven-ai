import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';
import { Role } from '@domain/aggregates/RoleAggregate/Role';
import { IPermissionRepository } from '@infrastructure/repositories/abstraction/IPermissionRepository';
import { IRolePermissionRepository } from '@infrastructure/repositories/abstraction/IRolePermissionRepository';
import { IRoleRepository } from '@infrastructure/repositories/abstraction/IRoleRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { AssignPermissionsCommand } from './AssignPermissionsCommand';
import { AssignPermissionsCommandHandler } from './AssignPermissionsCommandHandler';

describe('AssignPermissionsCommandHandler', () => {
  let links: jest.Mocked<IRolePermissionRepository>;
  let roles: jest.Mocked<IRoleRepository>;
  let permissions: jest.Mocked<IPermissionRepository>;
  let handler: AssignPermissionsCommandHandler;

  beforeEach(() => {
    links = {
      assignMany: jest.fn(),
      findByRoleAndPermission: jest.fn(),
      updateLink: jest.fn(),
      activePermissionIds: jest.fn().mockResolvedValue([]),
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
    permissions = {
      save: jest.fn(),
      updatePermission: jest.fn(),
      findById: jest
        .fn()
        .mockImplementation((id: number) =>
          Promise.resolve(
            Permission.rehydrate(id, `perm.${id}`, null, EntityStatus.Active),
          ),
        ),
      nameExists: jest.fn(),
    };
    handler = new AssignPermissionsCommandHandler(links, roles, permissions);
  });

  it('assigns a single permission', async () => {
    const response = await handler.execute(
      new AssignPermissionsCommand(1, [2]),
    );

    expect(links.assignMany).toHaveBeenCalledWith(1, [2]);
    expect(response).toEqual({ roleId: 1, assigned: [2] });
  });

  it('assigns several permissions in one call (FR-RP1)', async () => {
    await handler.execute(new AssignPermissionsCommand(1, [2, 3, 4]));

    expect(links.assignMany).toHaveBeenCalledWith(1, [2, 3, 4]);
  });

  it('collapses duplicate ids in the request', async () => {
    await handler.execute(new AssignPermissionsCommand(1, [2, 2, 3]));

    expect(links.assignMany).toHaveBeenCalledWith(1, [2, 3]);
  });

  it('rejects an empty permission list', async () => {
    await expect(
      handler.execute(new AssignPermissionsCommand(1, [])),
    ).rejects.toThrow(DomainError);
    expect(links.assignMany).not.toHaveBeenCalled();
  });

  it('404s when the role does not exist', async () => {
    roles.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new AssignPermissionsCommand(99, [2])),
    ).rejects.toThrow(NotFoundError);
    expect(links.assignMany).not.toHaveBeenCalled();
  });

  it('404s when a permission does not exist', async () => {
    permissions.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new AssignPermissionsCommand(1, [77])),
    ).rejects.toThrow('Permission 77 was not found.');
    expect(links.assignMany).not.toHaveBeenCalled();
  });

  it('409s when a permission is already assigned AND active (FR-RP4)', async () => {
    links.activePermissionIds.mockResolvedValue([2]);

    await expect(
      handler.execute(new AssignPermissionsCommand(1, [2])),
    ).rejects.toThrow(ConflictError);
    expect(links.assignMany).not.toHaveBeenCalled();
  });

  it('does NOT conflict on a previously removed permission — it reactivates (D-8)', async () => {
    // The link row still exists but is inactive, so it is absent from
    // activePermissionIds. This must be an ordinary assign, not a 409.
    links.activePermissionIds.mockResolvedValue([]);

    await expect(
      handler.execute(new AssignPermissionsCommand(1, [2])),
    ).resolves.toEqual({ roleId: 1, assigned: [2] });
    expect(links.assignMany).toHaveBeenCalledWith(1, [2]);
  });

  it('names every duplicate in the conflict message', async () => {
    links.activePermissionIds.mockResolvedValue([2, 3]);

    await expect(
      handler.execute(new AssignPermissionsCommand(1, [2, 3, 4])),
    ).rejects.toThrow('Permission(s) 2, 3 are already assigned');
  });

  it('validates the role before checking permissions, so a bad role fails fast', async () => {
    roles.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new AssignPermissionsCommand(99, [2])),
    ).rejects.toThrow(NotFoundError);
    expect(permissions.findById).not.toHaveBeenCalled();
  });
});
