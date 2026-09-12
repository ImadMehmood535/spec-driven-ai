import { ApiProperty } from '@nestjs/swagger';
import { RoleReadModel } from '@infrastructure/queries/abstraction/IRoleQueries';

export class GetRoleResponse {
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

  static from(row: RoleReadModel): GetRoleResponse {
    const response = new GetRoleResponse();
    Object.assign(response, row);
    return response;
  }
}
