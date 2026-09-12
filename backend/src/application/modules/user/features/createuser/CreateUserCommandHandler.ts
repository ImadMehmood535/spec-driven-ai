import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '@domain/aggregates/UserAggregate/User';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IRoleRepository';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IUserRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '@shared/security/IPasswordHasher';
import { CreateUserCommand } from './CreateUserCommand';
import { CreateUserResponse } from './CreateUserResponse';

const PASSWORD_MIN_LENGTH = 8;

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<
  CreateUserCommand,
  CreateUserResponse
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResponse> {
    if ((command.password ?? '').length < PASSWORD_MIN_LENGTH) {
      throw new DomainError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      );
    }

    if (command.roleId !== null && command.roleId !== undefined) {
      const role = await this.roleRepository.findById(command.roleId);
      if (!role) {
        throw new NotFoundError('Role was not found.');
      }
    }

    if (await this.userRepository.emailExists(command.email)) {
      throw new ConflictError('A user with that email already exists.');
    }
    if (await this.userRepository.usernameExists(command.username)) {
      throw new ConflictError('A user with that username already exists.');
    }

    // Hash before the aggregate exists, so no domain object ever holds plaintext.
    const passwordHash = await this.passwordHasher.hash(command.password);

    const user = User.create({
      email: command.email,
      username: command.username,
      firstName: command.firstName,
      lastName: command.lastName,
      passwordHash,
      roleId: command.roleId ?? null,
    });

    const saved = await this.userRepository.save(user);
    return CreateUserResponse.fromDomain(saved);
  }
}
