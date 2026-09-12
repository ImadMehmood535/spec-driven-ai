import { ApiProperty } from '@nestjs/swagger';

export class CheckUserPermissionResponse {
  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 'project.create' })
  permission!: string;

  @ApiProperty({ example: true })
  allowed!: boolean;

  static of(
    userId: number,
    permission: string,
    allowed: boolean,
  ): CheckUserPermissionResponse {
    const response = new CheckUserPermissionResponse();
    response.userId = userId;
    response.permission = permission;
    response.allowed = allowed;
    return response;
  }
}
