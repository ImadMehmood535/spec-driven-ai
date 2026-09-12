import { ApiProperty } from '@nestjs/swagger';
import { User } from '@domain/aggregates/UserAggregate/User';

/** No password field of any kind — not the plaintext, not the hash (NFR-3). */
export class UpdateUserResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ahmed@example.com' })
  email!: string;

  @ApiProperty({ example: 'ahmed' })
  username!: string;

  @ApiProperty({ example: 'Ahmed' })
  firstName!: string;

  @ApiProperty({ example: 'Khan' })
  lastName!: string;

  @ApiProperty({ example: null, nullable: true })
  roleId!: number | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  static fromDomain(user: User): UpdateUserResponse {
    const response = new UpdateUserResponse();
    response.id = user.id as number;
    response.email = user.email;
    response.username = user.username;
    response.firstName = user.firstName;
    response.lastName = user.lastName;
    response.roleId = user.roleId;
    response.entityStatus = user.entityStatus;
    return response;
  }
}
