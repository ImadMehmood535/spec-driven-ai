import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';
import { IPermissionRepository } from '@infrastructure/repositories/abstraction/IPermissionRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { CreatePermissionCommand } from './CreatePermissionCommand';
import { CreatePermissionCommandHandler } from './CreatePermissionCommandHandler';

describe('CreatePermissionCommandHandler', () => {
  let repository: jest.Mocked<IPermissionRepository>;
  let handler: CreatePermissionCommandHandler;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      updatePermission: jest.fn(),
      findById: jest.fn(),
      nameExists: jest.fn().mockResolvedValue(false),
    };
    handler = new CreatePermissionCommandHandler(repository);
  });

  it('saves the permission and returns it', async () => {
    repository.save.mockResolvedValue(
      Permission.rehydrate(1, 'project.create', null, EntityStatus.Active),
    );

    const response = await handler.execute(
      new CreatePermissionCommand('project.create', null),
    );

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      id: 1,
      name: 'project.create',
      description: null,
      entityStatus: EntityStatus.Active,
    });
  });

  it('rejects a duplicate name with a conflict', async () => {
    repository.nameExists.mockResolvedValue(true);

    await expect(
      handler.execute(new CreatePermissionCommand('project.create', null)),
    ).rejects.toThrow(ConflictError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('validates through the aggregate before touching the repository', async () => {
    await expect(
      handler.execute(new CreatePermissionCommand('   ', null)),
    ).rejects.toThrow('Permission name is required.');
    expect(repository.nameExists).not.toHaveBeenCalled();
  });

  it('checks uniqueness against the trimmed name', async () => {
    repository.save.mockResolvedValue(
      Permission.rehydrate(1, 'project.create', null, EntityStatus.Active),
    );

    await handler.execute(
      new CreatePermissionCommand('  project.create  ', null),
    );

    expect(repository.nameExists).toHaveBeenCalledWith('project.create');
  });
});
