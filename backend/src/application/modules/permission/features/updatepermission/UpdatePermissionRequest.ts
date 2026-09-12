import { ApiProperty } from '@nestjs/swagger';
import { EntityStatus } from '@shared/enums/EntityStatus';

export class UpdatePermissionRequest {
  @ApiProperty({ example: 'project.update', required: false, maxLength: 255 })
  name?: string;

  @ApiProperty({
    example: 'Update a project',
    required: false,
    nullable: true,
    maxLength: 512,
  })
  description?: string | null;

  @ApiProperty({
    example: 'INACTIVE',
    required: false,
    enum: EntityStatus,
    description: 'Activate or deactivate the permission (FR-P4)',
  })
  entityStatus?: EntityStatus;
}
