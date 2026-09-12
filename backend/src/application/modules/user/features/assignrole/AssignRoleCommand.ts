import { ICommand } from '@nestjs/cqrs';

export class AssignRoleCommand implements ICommand {
  constructor(
    public readonly userId: number,
    /** Null clears the role, leaving the user with no permissions (FR-AC4). */
    public readonly roleId: number | null,
  ) {}
}
