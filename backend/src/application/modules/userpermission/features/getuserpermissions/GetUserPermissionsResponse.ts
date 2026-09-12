import { ApiProperty } from '@nestjs/swagger';

export class GetUserPermissionsResponse {
  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({
    example: ['project.create', 'project.view'],
    type: [String],
    description:
      'Effective permission names, resolved through the assigned role. Empty when the user is inactive, has no role, or nothing active is granted (FR-AC3, FR-AC4).',
  })
  permissions!: string[];

  static of(userId: number, permissions: string[]): GetUserPermissionsResponse {
    const response = new GetUserPermissionsResponse();
    response.userId = userId;
    response.permissions = permissions;
    return response;
  }
}
