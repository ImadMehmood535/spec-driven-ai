import { RolePermission } from '@domain/aggregates/RolePermissionAggregate/RolePermission';
import { IRolePermissionRepository } from '@infrastructure/repositories/abstraction/IRolePermissionRepository';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { RemovePermissionCommand } from './RemovePermissionCommand';
import { RemovePermissionCommandHandler } from './RemovePermissionCommandHandler';

describe('RemovePermissionCommandHandler', () => {
  let links: jest.Mocked<IRolePermissionRepository>;
  let handler: RemovePermissionCommandHandler;

  beforeEach(() => {
    links = {
      assignMany: jest.fn(),
      findByRoleAndPermission: jest
        .fn()
        .mockResolvedValue(
          RolePermission.rehydrate(5, 1, 2, EntityStatus.Active),
        ),
      updateLink: jest.fn(),
      activePermissionIds: jest.fn(),
    };
    handler = new RemovePermissionCommandHandler(links);
  });

  it('deactivates the link rather than deleting it (D-8)', async () => {
    const response = await handler.execute(new RemovePermissionCommand(1, 2));

    expect(response.linkStatus).toBe(EntityStatus.Inactive);
    expect(links.updateLink).toHaveBeenCalledTimes(1);

    const updated = links.updateLink.mock.calls[0][0];
    expect(updated.id).toBe(5); // same row
    expect(updated.entityStatus).toBe(EntityStatus.Inactive);
  });

  it('404s when the permission is not assigned to the role', async () => {
    links.findByRoleAndPermission.mockResolvedValue(null);

    await expect(
      handler.execute(new RemovePermissionCommand(1, 99)),
    ).rejects.toThrow(NotFoundError);
    expect(links.updateLink).not.toHaveBeenCalled();
  });

  it('is idempotent on an already-removed link', async () => {
    links.findByRoleAndPermission.mockResolvedValue(
      RolePermission.rehydrate(5, 1, 2, EntityStatus.Inactive),
    );

    const response = await handler.execute(new RemovePermissionCommand(1, 2));

    expect(response.linkStatus).toBe(EntityStatus.Inactive);
  });

  it('exposes no method that could delete a row', () => {
    expect(Object.keys(links)).toEqual([
      'assignMany',
      'findByRoleAndPermission',
      'updateLink',
      'activePermissionIds',
    ]);
  });
});
