import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPermissionRepository,
  PERMISSION_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IPermissionRepository';
import {
  IRolePermissionRepository,
  ROLE_PERMISSION_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IRolePermissionRepository';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IRoleRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { AssignPermissionsCommand } from './AssignPermissionsCommand';
import { AssignPermissionsResponse } from './AssignPermissionsResponse';

@CommandHandler(AssignPermissionsCommand)
export class AssignPermissionsCommandHandler implements ICommandHandler<
  AssignPermissionsCommand,
  AssignPermissionsResponse
> {
  constructor(
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly linkRepository: IRolePermissionRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(
    command: AssignPermissionsCommand,
  ): Promise<AssignPermissionsResponse> {
    if (command.permissionIds.length === 0) {
      throw new DomainError('At least one permission id is required.');
    }

    const uniqueIds = [...new Set(command.permissionIds)];

    const role = await this.roleRepository.findById(command.roleId);
    if (!role) {
      throw new NotFoundError('Role was not found.');
    }

    for (const permissionId of uniqueIds) {
      const permission = await this.permissionRepository.findById(permissionId);
      if (!permission) {
        throw new NotFoundError(`Permission ${permissionId} was not found.`);
      }
    }

    // "Already assigned" means already assigned AND active (D-8). An inactive
    // link is not a conflict — it is the row assignMany will reactivate.
    const alreadyActive = await this.linkRepository.activePermissionIds(
      command.roleId,
    );
    const duplicates = uniqueIds.filter((id) => alreadyActive.includes(id));
    if (duplicates.length > 0) {
      throw new ConflictError(
        `Permission(s) ${duplicates.join(', ')} are already assigned to this role.`,
      );
    }

    await this.linkRepository.assignMany(command.roleId, uniqueIds);
    return AssignPermissionsResponse.of(command.roleId, uniqueIds);
  }
}
