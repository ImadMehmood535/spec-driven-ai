import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Role } from '@domain/aggregates/RoleAggregate/Role';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IRoleRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { CreateRoleCommand } from './CreateRoleCommand';
import { CreateRoleResponse } from './CreateRoleResponse';

@CommandHandler(CreateRoleCommand)
export class CreateRoleCommandHandler implements ICommandHandler<
  CreateRoleCommand,
  CreateRoleResponse
> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: CreateRoleCommand): Promise<CreateRoleResponse> {
    const role = Role.create({
      name: command.name,
      description: command.description,
    });

    // Checked here for a clean 409; the unique constraint is the real guarantee.
    if (await this.roleRepository.nameExists(role.name)) {
      throw new ConflictError(`Role "${role.name}" already exists.`);
    }

    const saved = await this.roleRepository.save(role);
    return CreateRoleResponse.fromDomain(saved);
  }
}
