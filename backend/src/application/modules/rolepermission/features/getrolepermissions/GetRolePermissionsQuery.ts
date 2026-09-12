import { IQuery } from '@nestjs/cqrs';

export class GetRolePermissionsQuery implements IQuery {
  constructor(
    public readonly roleId: number,
    public readonly includeInactive = false,
  ) {}
}
