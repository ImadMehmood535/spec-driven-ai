import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IRoleRepository';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IUserRepository';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { AssignRoleCommand } from './AssignRoleCommand';
import { AssignRoleResponse } from './AssignRoleResponse';

@CommandHandler(AssignRoleCommand)
export class AssignRoleCommandHandler implements ICommandHandler<
  AssignRoleCommand,
  AssignRoleResponse
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: AssignRoleCommand): Promise<AssignRoleResponse> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundError('User was not found.');
    }

    if (command.roleId !== null) {
      const role = await this.roleRepository.findById(command.roleId);
      if (!role) {
        throw new NotFoundError('Role was not found.');
      }
    }

    // Replaces, never accumulates — one role per user (§6).
    user.assignRole(command.roleId);
    await this.userRepository.updateUser(user);

    return AssignRoleResponse.fromDomain(user);
  }
}
