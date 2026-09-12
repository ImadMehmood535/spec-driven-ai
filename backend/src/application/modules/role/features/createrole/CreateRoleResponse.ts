import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@domain/aggregates/RoleAggregate/Role';

export class CreateRoleResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Developer Admin' })
  name!: string;

  @ApiProperty({
    example: 'Full access to developer platform features',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  static fromDomain(role: Role): CreateRoleResponse {
    const response = new CreateRoleResponse();
    response.id = role.id as number;
    response.name = role.name;
    response.description = role.description;
    response.entityStatus = role.entityStatus;
    return response;
  }
}
