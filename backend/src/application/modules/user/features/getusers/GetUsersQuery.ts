import { IQuery } from '@nestjs/cqrs';
import { UserListFilter } from '@infrastructure/queries/abstraction/IUserQueries';

export class GetUsersQuery implements IQuery {
  constructor(public readonly filter: UserListFilter) {}
}
