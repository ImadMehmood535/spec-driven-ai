import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleRequest {
  @ApiProperty({
    example: 1,
    nullable: true,
    description:
      'Replaces any existing role — one role per user (§6). Null clears it.',
  })
  roleId!: number | null;
}
