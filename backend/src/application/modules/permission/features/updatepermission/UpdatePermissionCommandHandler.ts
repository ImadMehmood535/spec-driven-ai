import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPermissionRepository,
  PERMISSION_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IPermissionRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { UpdatePermissionCommand } from './UpdatePermissionCommand';
import { UpdatePermissionResponse } from './UpdatePermissionResponse';

@CommandHandler(UpdatePermissionCommand)
export class UpdatePermissionCommandHandler implements ICommandHandler<
  UpdatePermissionCommand,
  UpdatePermissionResponse
> {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(
    command: UpdatePermissionCommand,
  ): Promise<UpdatePermissionResponse> {
    const permission = await this.permissionRepository.findById(command.id);
    if (!permission) {
      throw new NotFoundError('Permission was not found.');
    }

    if (command.name !== undefined) {
      permission.rename(command.name);
      if (
        await this.permissionRepository.nameExists(permission.name, command.id)
      ) {
        throw new ConflictError(
          `Permission "${permission.name}" already exists.`,
        );
      }
    }
    if (command.description !== undefined) {
      permission.changeDescription(command.description);
    }
    // FR-P4: activate/deactivate is a status transition on the aggregate.
    if (command.entityStatus !== undefined) {
      permission.changeStatus(command.entityStatus);
    }

    await this.permissionRepository.updatePermission(permission);
    return UpdatePermissionResponse.fromDomain(permission);
  }
}
