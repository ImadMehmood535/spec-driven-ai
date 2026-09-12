import { IQuery } from '@nestjs/cqrs';
import { PermissionListFilter } from '@infrastructure/queries/abstraction/IPermissionQueries';

export class GetPermissionsQuery implements IQuery {
  constructor(public readonly filter: PermissionListFilter) {}
}
