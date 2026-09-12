import { ApiProperty } from '@nestjs/swagger';
import { EntityStatus } from '@shared/enums/EntityStatus';

export class UpdateRoleRequest {
  @ApiProperty({
    example: 'Developer Manager',
    required: false,
    maxLength: 255,
  })
  name?: string;

  @ApiProperty({
    example: 'Limited access to developer platform features',
    required: false,
    nullable: true,
    maxLength: 512,
  })
  description?: string | null;

  @ApiProperty({
    example: 'INACTIVE',
    required: false,
    enum: EntityStatus,
    description: 'Activate or deactivate the role (FR-R4)',
  })
  entityStatus?: EntityStatus;
}
