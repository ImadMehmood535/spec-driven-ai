import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IUserPermissionQueries,
  USER_PERMISSION_QUERIES,
} from '@infrastructure/queries/abstraction/IUserPermissionQueries';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { CheckUserPermissionQuery } from './CheckUserPermissionQuery';
import { CheckUserPermissionResponse } from './CheckUserPermissionResponse';

@QueryHandler(CheckUserPermissionQuery)
export class CheckUserPermissionQueryHandler implements IQueryHandler<
  CheckUserPermissionQuery,
  CheckUserPermissionResponse
> {
  constructor(
    @Inject(USER_PERMISSION_QUERIES)
    private readonly queries: IUserPermissionQueries,
  ) {}

  async execute(
    query: CheckUserPermissionQuery,
  ): Promise<CheckUserPermissionResponse> {
    const name = (query.permissionName ?? '').trim();
    if (name.length === 0) {
      throw new DomainError('Permission name is required.');
    }

    if (!(await this.queries.userExists(query.userId))) {
      throw new NotFoundError('User was not found.');
    }

    const permissions = await this.queries.findEffectivePermissionNames(
      query.userId,
    );

    return CheckUserPermissionResponse.of(
      query.userId,
      name,
      permissions.includes(name),
    );
  }
}
