import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordRequest {
  @ApiProperty({
    example: 'set-a-real-password',
    minLength: 8,
    description:
      'Hashed before storage. Never returned, and redacted from logs (NFR-3).',
  })
  newPassword!: string;
}
