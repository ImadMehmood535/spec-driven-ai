import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequest {
  @ApiProperty({ example: 'ahmed@example.com', maxLength: 255 })
  email!: string;

  @ApiProperty({ example: 'ahmed', maxLength: 255 })
  username!: string;

  @ApiProperty({ example: 'Ahmed', maxLength: 255 })
  firstName!: string;

  @ApiProperty({ example: 'Khan', maxLength: 255 })
  lastName!: string;

  @ApiProperty({
    example: 'set-a-real-password',
    description:
      'Hashed before storage; never returned and redacted from logs (NFR-3)',
  })
  password!: string;

  @ApiProperty({
    example: null,
    required: false,
    nullable: true,
    description:
      'A user may have no role, which grants no permissions (FR-AC4)',
  })
  roleId?: number | null;
}
