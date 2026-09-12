import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '@application/common/PaginationMeta';
import { UserReadModel } from '@infrastructure/queries/abstraction/IUserQueries';
import { GetUserResponse } from '../getuser/GetUserResponse';

export class GetUsersResponse {
  @ApiProperty({ type: [GetUserResponse] })
  items!: GetUserResponse[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;

  static from(
    rows: UserReadModel[],
    page: number,
    size: number,
    total: number,
  ): GetUsersResponse {
    const response = new GetUsersResponse();
    response.items = rows.map((row) => GetUserResponse.from(row));
    response.meta = PaginationMeta.of(page, size, total);
    return response;
  }
}
