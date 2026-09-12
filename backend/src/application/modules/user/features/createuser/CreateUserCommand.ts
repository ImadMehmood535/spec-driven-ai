import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly firstName: string,
    public readonly lastName: string,
    /** Plaintext, hashed by the handler and never persisted or returned. */
    public readonly password: string,
    public readonly roleId: number | null,
  ) {}
}
