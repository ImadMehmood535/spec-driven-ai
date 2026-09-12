import { ICommand } from '@nestjs/cqrs';

/**
 * An administrator setting a new password for a user (D-9). Not a reset flow:
 * no current-password challenge, no token, no expiry.
 */
export class ChangePasswordCommand implements ICommand {
  constructor(
    public readonly userId: number,
    public readonly newPassword: string,
  ) {}
}
