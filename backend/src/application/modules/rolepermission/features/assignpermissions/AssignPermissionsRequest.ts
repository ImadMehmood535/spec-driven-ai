import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsRequest {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Permission ids to assign to the role (FR-RP1)',
    type: [Number],
  })
  permissionIds!: number[];
}
