import { ICommand } from '@nestjs/cqrs';

export class LoginCommand implements ICommand {
  constructor(
    /** Email or username — the scope names both as identity. */
    public readonly identifier: string,
    public readonly password: string,
  ) {}
}
