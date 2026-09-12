import { ICommand } from '@nestjs/cqrs';

export class RemovePermissionCommand implements ICommand {
  constructor(
    public readonly roleId: number,
    public readonly permissionId: number,
  ) {}
}
