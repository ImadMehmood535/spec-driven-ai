import { ApiProperty } from '@nestjs/swagger';

/** Carries no password material, only confirmation that it changed. */
export class ChangePasswordResponse {
  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: true })
  passwordChanged!: boolean;

  static of(userId: number): ChangePasswordResponse {
    const response = new ChangePasswordResponse();
    response.userId = userId;
    response.passwordChanged = true;
    return response;
  }
}
