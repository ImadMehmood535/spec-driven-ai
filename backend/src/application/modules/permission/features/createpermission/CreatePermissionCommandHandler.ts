import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';
import {
  IPermissionRepository,
  PERMISSION_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IPermissionRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { CreatePermissionCommand } from './CreatePermissionCommand';
import { CreatePermissionResponse } from './CreatePermissionResponse';

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionCommandHandler implements ICommandHandler<
  CreatePermissionCommand,
  CreatePermissionResponse
> {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(
    command: CreatePermissionCommand,
  ): Promise<CreatePermissionResponse> {
    const permission = Permission.create({
      name: command.name,
      description: command.description,
    });

    // Checked here for a clean 409; the unique constraint is the real guarantee.
    if (await this.permissionRepository.nameExists(permission.name)) {
      throw new ConflictError(
        `Permission "${permission.name}" already exists.`,
      );
    }

    const saved = await this.permissionRepository.save(permission);
    return CreatePermissionResponse.fromDomain(saved);
  }
}
