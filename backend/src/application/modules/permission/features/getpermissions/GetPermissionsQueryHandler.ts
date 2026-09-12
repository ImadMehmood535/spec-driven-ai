import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPermissionQueries,
  PERMISSION_QUERIES,
} from '@infrastructure/queries/abstraction/IPermissionQueries';
import { GetPermissionsQuery } from './GetPermissionsQuery';
import { GetPermissionsResponse } from './GetPermissionsResponse';

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsQueryHandler implements IQueryHandler<
  GetPermissionsQuery,
  GetPermissionsResponse
> {
  constructor(
    @Inject(PERMISSION_QUERIES)
    private readonly permissionQueries: IPermissionQueries,
  ) {}

  async execute(query: GetPermissionsQuery): Promise<GetPermissionsResponse> {
    const { rows, total } = await this.permissionQueries.findList(query.filter);
    return GetPermissionsResponse.from(
      rows,
      query.filter.page,
      query.filter.size,
      total,
    );
  }
}
