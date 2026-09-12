import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IRoleRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { UpdateRoleCommand } from './UpdateRoleCommand';
import { UpdateRoleResponse } from './UpdateRoleResponse';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleCommandHandler implements ICommandHandler<
  UpdateRoleCommand,
  UpdateRoleResponse
> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<UpdateRoleResponse> {
    const role = await this.roleRepository.findById(command.id);
    if (!role) {
      throw new NotFoundError('Role was not found.');
    }

    if (command.name !== undefined) {
      role.rename(command.name);
      if (await this.roleRepository.nameExists(role.name, command.id)) {
        throw new ConflictError(`Role "${role.name}" already exists.`);
      }
    }
    if (command.description !== undefined) {
      role.changeDescription(command.description);
    }
    // FR-R4: activate/deactivate is a status transition on the aggregate.
    if (command.entityStatus !== undefined) {
      role.changeStatus(command.entityStatus);
    }

    await this.roleRepository.updateRole(role);
    return UpdateRoleResponse.fromDomain(role);
  }
}
