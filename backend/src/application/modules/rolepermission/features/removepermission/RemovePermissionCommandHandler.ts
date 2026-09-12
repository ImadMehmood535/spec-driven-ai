import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IRolePermissionRepository,
  ROLE_PERMISSION_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IRolePermissionRepository';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { RemovePermissionCommand } from './RemovePermissionCommand';
import { RemovePermissionResponse } from './RemovePermissionResponse';

@CommandHandler(RemovePermissionCommand)
export class RemovePermissionCommandHandler implements ICommandHandler<
  RemovePermissionCommand,
  RemovePermissionResponse
> {
  constructor(
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly linkRepository: IRolePermissionRepository,
  ) {}

  async execute(
    command: RemovePermissionCommand,
  ): Promise<RemovePermissionResponse> {
    const link = await this.linkRepository.findByRoleAndPermission(
      command.roleId,
      command.permissionId,
    );
    if (!link) {
      throw new NotFoundError('That permission is not assigned to this role.');
    }

    // D-8: deactivate, never delete. Idempotent — removing an already-removed
    // permission leaves it inactive rather than failing.
    link.deactivate();
    await this.linkRepository.updateLink(link);

    return RemovePermissionResponse.of(
      command.roleId,
      command.permissionId,
      link.entityStatus,
    );
  }
}
