import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IUserQueries,
  USER_QUERIES,
} from '@infrastructure/queries/abstraction/IUserQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetUserQuery } from './GetUserQuery';
import { GetUserResponse } from './GetUserResponse';

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<
  GetUserQuery,
  GetUserResponse
> {
  constructor(
    @Inject(USER_QUERIES)
    private readonly userQueries: IUserQueries,
  ) {}

  async execute(query: GetUserQuery): Promise<GetUserResponse> {
    const row = await this.userQueries.findById(query.id);
    if (!row) {
      throw new NotFoundError('User was not found.');
    }
    return GetUserResponse.from(row);
  }
}
