import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IUserPermissionQueries,
  USER_PERMISSION_QUERIES,
} from '@infrastructure/queries/abstraction/IUserPermissionQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetUserPermissionsQuery } from './GetUserPermissionsQuery';
import { GetUserPermissionsResponse } from './GetUserPermissionsResponse';

@QueryHandler(GetUserPermissionsQuery)
export class GetUserPermissionsQueryHandler implements IQueryHandler<
  GetUserPermissionsQuery,
  GetUserPermissionsResponse
> {
  constructor(
    @Inject(USER_PERMISSION_QUERIES)
    private readonly queries: IUserPermissionQueries,
  ) {}

  async execute(
    query: GetUserPermissionsQuery,
  ): Promise<GetUserPermissionsResponse> {
    // Existence first: a non-existent user is a 404, while an existing but
    // inactive one legitimately resolves to no permissions. Conflating the two
    // would let a caller read "unknown id" as "properly denied".
    if (!(await this.queries.userExists(query.userId))) {
      throw new NotFoundError('User was not found.');
    }

    const permissions = await this.queries.findEffectivePermissionNames(
      query.userId,
    );
    return GetUserPermissionsResponse.of(query.userId, permissions);
  }
}
