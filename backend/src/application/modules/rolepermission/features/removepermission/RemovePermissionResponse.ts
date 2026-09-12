import { ApiProperty } from '@nestjs/swagger';

export class RemovePermissionResponse {
  @ApiProperty({ example: 1 })
  roleId!: number;

  @ApiProperty({ example: 2 })
  permissionId!: number;

  @ApiProperty({
    example: 'INACTIVE',
    description: 'The link is deactivated, not deleted (D-8)',
  })
  linkStatus!: string;

  static of(
    roleId: number,
    permissionId: number,
    linkStatus: string,
  ): RemovePermissionResponse {
    const response = new RemovePermissionResponse();
    response.roleId = roleId;
    response.permissionId = permissionId;
    response.linkStatus = linkStatus;
    return response;
  }
}
