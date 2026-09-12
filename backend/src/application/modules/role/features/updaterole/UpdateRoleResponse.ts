import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@domain/aggregates/RoleAggregate/Role';

export class UpdateRoleResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Developer Manager' })
  name!: string;

  @ApiProperty({
    example: 'Limited access to developer platform features',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  static fromDomain(role: Role): UpdateRoleResponse {
    const response = new UpdateRoleResponse();
    response.id = role.id as number;
    response.name = role.name;
    response.description = role.description;
    response.entityStatus = role.entityStatus;
    return response;
  }
}
