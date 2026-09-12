import { Role } from '@domain/aggregates/RoleAggregate/Role';
import { IRoleRepository } from '@infrastructure/repositories/abstraction/IRoleRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { UpdateRoleCommand } from './UpdateRoleCommand';
import { UpdateRoleCommandHandler } from './UpdateRoleCommandHandler';

describe('UpdateRoleCommandHandler', () => {
  let repository: jest.Mocked<IRoleRepository>;
  let handler: UpdateRoleCommandHandler;

  const existing = () =>
    Role.rehydrate(1, 'Developer Admin', 'old', EntityStatus.Active);

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      updateRole: jest.fn(),
      findById: jest.fn().mockResolvedValue(existing()),
      nameExists: jest.fn().mockResolvedValue(false),
    };
    handler = new UpdateRoleCommandHandler(repository);
  });

  it('throws NotFoundError when the role is absent', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateRoleCommand(1, 'x')),
    ).rejects.toThrow(NotFoundError);
  });

  it('updates only the fields provided', async () => {
    const response = await handler.execute(
      new UpdateRoleCommand(1, 'Developer Manager'),
    );

    expect(response.name).toBe('Developer Manager');
    expect(response.description).toBe('old');
    expect(response.entityStatus).toBe(EntityStatus.Active);
  });

  it('clears a description when null is passed explicitly', async () => {
    const response = await handler.execute(
      new UpdateRoleCommand(1, undefined, null),
    );

    expect(response.description).toBeNull();
  });

  it('deactivates through a status change (FR-P4)', async () => {
    const response = await handler.execute(
      new UpdateRoleCommand(1, undefined, undefined, EntityStatus.Inactive),
    );

    expect(response.entityStatus).toBe(EntityStatus.Inactive);
    expect(repository.updateRole).toHaveBeenCalledTimes(1);
  });

  it('rejects renaming onto an existing name', async () => {
    repository.nameExists.mockResolvedValue(true);

    await expect(
      handler.execute(new UpdateRoleCommand(1, 'Developer Viewer')),
    ).rejects.toThrow(ConflictError);
    expect(repository.updateRole).not.toHaveBeenCalled();
  });

  it('excludes itself from the uniqueness check', async () => {
    await handler.execute(new UpdateRoleCommand(1, 'Developer Admin'));

    expect(repository.nameExists).toHaveBeenCalledWith('Developer Admin', 1);
  });

  it('does not check uniqueness when the name is untouched', async () => {
    await handler.execute(
      new UpdateRoleCommand(1, undefined, 'new description'),
    );

    expect(repository.nameExists).not.toHaveBeenCalled();
  });

  it('deactivating a role touches only the role — no cascade (FR-AC3 handles the effect)', async () => {
    await handler.execute(
      new UpdateRoleCommand(1, undefined, undefined, EntityStatus.Inactive),
    );

    // The repository exposes no method that could deactivate users or links,
    // and the handler calls only updateRole. FR-AC3 excludes permissions reached
    // through an inactive role at resolution time instead.
    expect(Object.keys(repository)).toEqual([
      'save',
      'updateRole',
      'findById',
      'nameExists',
    ]);
    expect(repository.updateRole).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid status', async () => {
    await expect(
      handler.execute(
        new UpdateRoleCommand(1, undefined, undefined, 'DRAFT' as EntityStatus),
      ),
    ).rejects.toThrow('Invalid entity status.');
  });
});
