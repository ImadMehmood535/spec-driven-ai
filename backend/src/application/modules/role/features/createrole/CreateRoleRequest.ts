import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleRequest {
  @ApiProperty({ example: 'Developer Admin', maxLength: 255 })
  name!: string;

  @ApiProperty({
    example: 'Full access to developer platform features',
    required: false,
    nullable: true,
    maxLength: 512,
  })
  description?: string | null;
}
