import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '@application/common/PaginationMeta';
import { PermissionReadModel } from '@infrastructure/queries/abstraction/IPermissionQueries';

export class GetPermissionsResponseItem {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'a3f1c2e4-5b6d-4e7f-8a9b-0c1d2e3f4a5b' })
  globalUId!: string;

  @ApiProperty({ example: 'project.create' })
  name!: string;

  @ApiProperty({ example: 'Create a project', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  @ApiProperty({ example: '2026-09-12T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: null, nullable: true })
  modifiedOn!: string | null;
}

export class GetPermissionsResponse {
  @ApiProperty({ type: [GetPermissionsResponseItem] })
  items!: GetPermissionsResponseItem[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;

  static from(
    rows: PermissionReadModel[],
    page: number,
    size: number,
    total: number,
  ): GetPermissionsResponse {
    const response = new GetPermissionsResponse();
    response.items = rows.map((row) => ({ ...row }));
    response.meta = PaginationMeta.of(page, size, total);
    return response;
  }
}
