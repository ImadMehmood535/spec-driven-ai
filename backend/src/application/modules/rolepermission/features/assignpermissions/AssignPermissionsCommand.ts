import { ICommand } from '@nestjs/cqrs';

export class AssignPermissionsCommand implements ICommand {
  constructor(
    public readonly roleId: number,
    public readonly permissionIds: number[],
  ) {}
}
