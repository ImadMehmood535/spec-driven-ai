import { IQuery } from '@nestjs/cqrs';

export class CheckUserPermissionQuery implements IQuery {
  constructor(
    public readonly userId: number,
    public readonly permissionName: string,
  ) {}
}
