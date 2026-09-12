import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@infrastructure/repositories/abstraction/IUserRepository';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '@shared/security/IPasswordHasher';
import { ChangePasswordCommand } from './ChangePasswordCommand';
import { ChangePasswordResponse } from './ChangePasswordResponse';

const PASSWORD_MIN_LENGTH = 8;

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler implements ICommandHandler<
  ChangePasswordCommand,
  ChangePasswordResponse
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(
    command: ChangePasswordCommand,
  ): Promise<ChangePasswordResponse> {
    if ((command.newPassword ?? '').length < PASSWORD_MIN_LENGTH) {
      throw new DomainError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      );
    }

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundError('User was not found.');
    }

    const passwordHash = await this.passwordHasher.hash(command.newPassword);
    user.changePasswordHash(passwordHash);
    await this.userRepository.updateUser(user);

    return ChangePasswordResponse.of(command.userId);
  }
}
