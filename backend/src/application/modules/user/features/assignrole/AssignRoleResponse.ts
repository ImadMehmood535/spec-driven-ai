import { ApiProperty } from '@nestjs/swagger';
import { User } from '@domain/aggregates/UserAggregate/User';

export class AssignRoleResponse {
  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 2, nullable: true })
  roleId!: number | null;

  static fromDomain(user: User): AssignRoleResponse {
    const response = new AssignRoleResponse();
    response.userId = user.id as number;
    response.roleId = user.roleId;
    return response;
  }
}
