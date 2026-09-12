import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    example: 'ahmed@example.com',
    description: 'Email or username',
  })
  identifier!: string;

  @ApiProperty({
    example: 'a-real-password',
    description: 'Redacted from logs (NFR-3)',
  })
  password!: string;
}
