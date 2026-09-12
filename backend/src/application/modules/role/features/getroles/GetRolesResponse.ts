import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '@application/common/PaginationMeta';
import { RoleReadModel } from '@infrastructure/queries/abstraction/IRoleQueries';

export class GetRolesResponseItem {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'a3f1c2e4-5b6d-4e7f-8a9b-0c1d2e3f4a5b' })
  globalUId!: string;

  @ApiProperty({ example: 'Developer Admin' })
  name!: string;

  @ApiProperty({
    example: 'Full access to developer platform features',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  @ApiProperty({ example: '2026-09-12T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: null, nullable: true })
  modifiedOn!: string | null;
}

export class GetRolesResponse {
  @ApiProperty({ type: [GetRolesResponseItem] })
  items!: GetRolesResponseItem[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;

  static from(
    rows: RoleReadModel[],
    page: number,
    size: number,
    total: number,
  ): GetRolesResponse {
    const response = new GetRolesResponse();
    response.items = rows.map((row) => ({ ...row }));
    response.meta = PaginationMeta.of(page, size, total);
    return response;
  }
}
