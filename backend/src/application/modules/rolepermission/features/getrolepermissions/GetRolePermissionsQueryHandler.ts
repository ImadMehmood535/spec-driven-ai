import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IRolePermissionQueries,
  ROLE_PERMISSION_QUERIES,
} from '@infrastructure/queries/abstraction/IRolePermissionQueries';
import {
  IRoleQueries,
  ROLE_QUERIES,
} from '@infrastructure/queries/abstraction/IRoleQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetRolePermissionsQuery } from './GetRolePermissionsQuery';
import { GetRolePermissionsResponse } from './GetRolePermissionsResponse';

@QueryHandler(GetRolePermissionsQuery)
export class GetRolePermissionsQueryHandler implements IQueryHandler<
  GetRolePermissionsQuery,
  GetRolePermissionsResponse
> {
  constructor(
    @Inject(ROLE_PERMISSION_QUERIES)
    private readonly linkQueries: IRolePermissionQueries,
    @Inject(ROLE_QUERIES)
    private readonly roleQueries: IRoleQueries,
  ) {}

  async execute(
    query: GetRolePermissionsQuery,
  ): Promise<GetRolePermissionsResponse> {
    // A missing role is 404, not an empty list — absent and "has none" differ.
    const role = await this.roleQueries.findById(query.roleId);
    if (!role) {
      throw new NotFoundError('Role was not found.');
    }

    const rows = await this.linkQueries.findByRole(
      query.roleId,
      query.includeInactive,
    );
    return GetRolePermissionsResponse.from(query.roleId, rows);
  }
}
