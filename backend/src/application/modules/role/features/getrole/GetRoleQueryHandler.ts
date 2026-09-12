import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IRoleQueries,
  ROLE_QUERIES,
} from '@infrastructure/queries/abstraction/IRoleQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetRoleQuery } from './GetRoleQuery';
import { GetRoleResponse } from './GetRoleResponse';

@QueryHandler(GetRoleQuery)
export class GetRoleQueryHandler implements IQueryHandler<
  GetRoleQuery,
  GetRoleResponse
> {
  constructor(
    @Inject(ROLE_QUERIES)
    private readonly roleQueries: IRoleQueries,
  ) {}

  async execute(query: GetRoleQuery): Promise<GetRoleResponse> {
    const row = await this.roleQueries.findById(query.id);
    if (!row) {
      throw new NotFoundError('Role was not found.');
    }
    return GetRoleResponse.from(row);
  }
}
