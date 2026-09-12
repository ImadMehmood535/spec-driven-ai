import { ICommand } from '@nestjs/cqrs';
import { EntityStatus } from '@shared/enums/EntityStatus';

/** No password field — changing a password is its own command (D-9). */
export class UpdateUserCommand implements ICommand {
  constructor(
    public readonly id: number,
    public readonly email?: string,
    public readonly username?: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly entityStatus?: EntityStatus,
  ) {}
}
