import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IUserRepository';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { UpdateUserCommand } from './UpdateUserCommand';
import { UpdateUserResponse } from './UpdateUserResponse';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler implements ICommandHandler<
  UpdateUserCommand,
  UpdateUserResponse
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UpdateUserResponse> {
    const user = await this.userRepository.findById(command.id);
    if (!user) {
      throw new NotFoundError('User was not found.');
    }

    if (command.email !== undefined) {
      user.changeEmail(command.email);
      if (await this.userRepository.emailExists(user.email, command.id)) {
        throw new ConflictError('A user with that email already exists.');
      }
    }
    if (command.username !== undefined) {
      user.changeUsername(command.username);
      if (await this.userRepository.usernameExists(user.username, command.id)) {
        throw new ConflictError('A user with that username already exists.');
      }
    }
    if (command.firstName !== undefined) {
      user.changeFirstName(command.firstName);
    }
    if (command.lastName !== undefined) {
      user.changeLastName(command.lastName);
    }
    // FR-U4. FR-U7 (a deactivated user cannot authenticate) is enforced in
    // authentication-login; this only records the status.
    if (command.entityStatus !== undefined) {
      user.changeStatus(command.entityStatus);
    }

    await this.userRepository.updateUser(user);
    return UpdateUserResponse.fromDomain(user);
  }
}
