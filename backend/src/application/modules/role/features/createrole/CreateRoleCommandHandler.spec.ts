import { Role } from '@domain/aggregates/RoleAggregate/Role';
import { IRoleRepository } from '@infrastructure/repositories/abstraction/IRoleRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { EntityStatus } from '@shared/enums/EntityStatus';
import { CreateRoleCommand } from './CreateRoleCommand';
import { CreateRoleCommandHandler } from './CreateRoleCommandHandler';

describe('CreateRoleCommandHandler', () => {
  let repository: jest.Mocked<IRoleRepository>;
  let handler: CreateRoleCommandHandler;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      updateRole: jest.fn(),
      findById: jest.fn(),
      nameExists: jest.fn().mockResolvedValue(false),
    };
    handler = new CreateRoleCommandHandler(repository);
  });

  it('saves the role and returns it', async () => {
    repository.save.mockResolvedValue(
      Role.rehydrate(1, 'Developer Admin', null, EntityStatus.Active),
    );

    const response = await handler.execute(
      new CreateRoleCommand('Developer Admin', null),
    );

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      id: 1,
      name: 'Developer Admin',
      description: null,
      entityStatus: EntityStatus.Active,
    });
  });

  it('rejects a duplicate name with a conflict', async () => {
    repository.nameExists.mockResolvedValue(true);

    await expect(
      handler.execute(new CreateRoleCommand('Developer Admin', null)),
    ).rejects.toThrow(ConflictError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('validates through the aggregate before touching the repository', async () => {
    await expect(
      handler.execute(new CreateRoleCommand('   ', null)),
    ).rejects.toThrow('Role name is required.');
    expect(repository.nameExists).not.toHaveBeenCalled();
  });

  it('checks uniqueness against the trimmed name', async () => {
    repository.save.mockResolvedValue(
      Role.rehydrate(1, 'Developer Admin', null, EntityStatus.Active),
    );

    await handler.execute(new CreateRoleCommand('  Developer Admin  ', null));

    expect(repository.nameExists).toHaveBeenCalledWith('Developer Admin');
  });
});
