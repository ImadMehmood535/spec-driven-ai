import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IRoleQueries,
  ROLE_QUERIES,
} from '@infrastructure/queries/abstraction/IRoleQueries';
import { GetRolesQuery } from './GetRolesQuery';
import { GetRolesResponse } from './GetRolesResponse';

@QueryHandler(GetRolesQuery)
export class GetRolesQueryHandler implements IQueryHandler<
  GetRolesQuery,
  GetRolesResponse
> {
  constructor(
    @Inject(ROLE_QUERIES)
    private readonly roleQueries: IRoleQueries,
  ) {}

  async execute(query: GetRolesQuery): Promise<GetRolesResponse> {
    const { rows, total } = await this.roleQueries.findList(query.filter);
    return GetRolesResponse.from(
      rows,
      query.filter.page,
      query.filter.size,
      total,
    );
  }
}
