import { ApiProperty } from '@nestjs/swagger';
import { PermissionReadModel } from '@infrastructure/queries/abstraction/IPermissionQueries';

export class GetPermissionResponse {
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

  static from(row: PermissionReadModel): GetPermissionResponse {
    const response = new GetPermissionResponse();
    Object.assign(response, row);
    return response;
  }
}
