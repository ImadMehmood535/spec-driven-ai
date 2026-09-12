import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPermissionQueries,
  PERMISSION_QUERIES,
} from '@infrastructure/queries/abstraction/IPermissionQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetPermissionQuery } from './GetPermissionQuery';
import { GetPermissionResponse } from './GetPermissionResponse';

@QueryHandler(GetPermissionQuery)
export class GetPermissionQueryHandler implements IQueryHandler<
  GetPermissionQuery,
  GetPermissionResponse
> {
  constructor(
    @Inject(PERMISSION_QUERIES)
    private readonly permissionQueries: IPermissionQueries,
  ) {}

  async execute(query: GetPermissionQuery): Promise<GetPermissionResponse> {
    const row = await this.permissionQueries.findById(query.id);
    if (!row) {
      throw new NotFoundError('Permission was not found.');
    }
    return GetPermissionResponse.from(row);
  }
}
