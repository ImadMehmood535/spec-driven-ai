import { IQuery } from '@nestjs/cqrs';
import { RoleListFilter } from '@infrastructure/queries/abstraction/IRoleQueries';

export class GetRolesQuery implements IQuery {
  constructor(public readonly filter: RoleListFilter) {}
}
