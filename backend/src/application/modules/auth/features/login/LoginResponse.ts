import { ApiProperty } from '@nestjs/swagger';

/** Carries the token and nothing else — no user object, no hash. */
export class LoginResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: '1h' })
  expiresIn!: string;

  static of(accessToken: string, expiresIn: string): LoginResponse {
    const response = new LoginResponse();
    response.accessToken = accessToken;
    response.expiresIn = expiresIn;
    return response;
  }
}
