import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionRequest {
  @ApiProperty({ example: 'project.create', maxLength: 255 })
  name!: string;

  @ApiProperty({
    example: 'Create a project',
    required: false,
    nullable: true,
    maxLength: 512,
  })
  description?: string | null;
}
