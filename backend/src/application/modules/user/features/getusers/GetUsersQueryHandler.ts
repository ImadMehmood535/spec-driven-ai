import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IUserQueries,
  USER_QUERIES,
} from '@infrastructure/queries/abstraction/IUserQueries';
import { GetUsersQuery } from './GetUsersQuery';
import { GetUsersResponse } from './GetUsersResponse';

@QueryHandler(GetUsersQuery)
export class GetUsersQueryHandler implements IQueryHandler<
  GetUsersQuery,
  GetUsersResponse
> {
  constructor(
    @Inject(USER_QUERIES)
    private readonly userQueries: IUserQueries,
  ) {}

  async execute(query: GetUsersQuery): Promise<GetUsersResponse> {
    const { rows, total } = await this.userQueries.findList(query.filter);
    return GetUsersResponse.from(
      rows,
      query.filter.page,
      query.filter.size,
      total,
    );
  }
}
