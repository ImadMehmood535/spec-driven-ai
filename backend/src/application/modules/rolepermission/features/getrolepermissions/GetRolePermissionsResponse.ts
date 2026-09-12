import { ApiProperty } from '@nestjs/swagger';
import { RolePermissionReadModel } from '@infrastructure/queries/abstraction/IRolePermissionQueries';

export class GetRolePermissionsResponseItem {
  @ApiProperty({ example: 4 })
  linkId!: number;

  @ApiProperty({ example: 2 })
  permissionId!: number;

  @ApiProperty({ example: 'project.create' })
  name!: string;

  @ApiProperty({ example: 'Create a project', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  permissionStatus!: string;

  @ApiProperty({ example: 'ACTIVE' })
  linkStatus!: string;

  @ApiProperty({ example: '2026-09-12T00:00:00.000Z' })
  createdAt!: string;
}

export class GetRolePermissionsResponse {
  @ApiProperty({ example: 1 })
  roleId!: number;

  @ApiProperty({ type: [GetRolePermissionsResponseItem] })
  items!: GetRolePermissionsResponseItem[];

  static from(
    roleId: number,
    rows: RolePermissionReadModel[],
  ): GetRolePermissionsResponse {
    const response = new GetRolePermissionsResponse();
    response.roleId = roleId;
    response.items = rows.map((row) => ({ ...row }));
    return response;
  }
}
