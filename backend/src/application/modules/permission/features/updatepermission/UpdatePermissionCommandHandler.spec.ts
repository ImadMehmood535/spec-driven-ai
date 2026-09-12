import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';
import { IPermissionRepository } from '@infrastructure/repositories/abstraction/IPermissionRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { UpdatePermissionCommand } from './UpdatePermissionCommand';
import { UpdatePermissionCommandHandler } from './UpdatePermissionCommandHandler';

describe('UpdatePermissionCommandHandler', () => {
  let repository: jest.Mocked<IPermissionRepository>;
  let handler: UpdatePermissionCommandHandler;

  const existing = () =>
    Permission.rehydrate(1, 'project.create', 'old', EntityStatus.Active);

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      updatePermission: jest.fn(),
      findById: jest.fn().mockResolvedValue(existing()),
      nameExists: jest.fn().mockResolvedValue(false),
    };
    handler = new UpdatePermissionCommandHandler(repository);
  });

  it('throws NotFoundError when the permission is absent', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdatePermissionCommand(1, 'x')),
    ).rejects.toThrow(NotFoundError);
  });

  it('updates only the fields provided', async () => {
    const response = await handler.execute(
      new UpdatePermissionCommand(1, 'project.update'),
    );

    expect(response.name).toBe('project.update');
    expect(response.description).toBe('old');
    expect(response.entityStatus).toBe(EntityStatus.Active);
  });

  it('clears a description when null is passed explicitly', async () => {
    const response = await handler.execute(
      new UpdatePermissionCommand(1, undefined, null),
    );

    expect(response.description).toBeNull();
  });

  it('deactivates through a status change (FR-P4)', async () => {
    const response = await handler.execute(
      new UpdatePermissionCommand(
        1,
        undefined,
        undefined,
        EntityStatus.Inactive,
      ),
    );

    expect(response.entityStatus).toBe(EntityStatus.Inactive);
    expect(repository.updatePermission).toHaveBeenCalledTimes(1);
  });

  it('rejects renaming onto an existing name', async () => {
    repository.nameExists.mockResolvedValue(true);

    await expect(
      handler.execute(new UpdatePermissionCommand(1, 'project.view')),
    ).rejects.toThrow(ConflictError);
    expect(repository.updatePermission).not.toHaveBeenCalled();
  });

  it('excludes itself from the uniqueness check', async () => {
    await handler.execute(new UpdatePermissionCommand(1, 'project.create'));

    expect(repository.nameExists).toHaveBeenCalledWith('project.create', 1);
  });

  it('does not check uniqueness when the name is untouched', async () => {
    await handler.execute(
      new UpdatePermissionCommand(1, undefined, 'new description'),
    );

    expect(repository.nameExists).not.toHaveBeenCalled();
  });

  it('rejects an invalid status', async () => {
    await expect(
      handler.execute(
        new UpdatePermissionCommand(
          1,
          undefined,
          undefined,
          'DRAFT' as EntityStatus,
        ),
      ),
    ).rejects.toThrow('Invalid entity status.');
  });
});
