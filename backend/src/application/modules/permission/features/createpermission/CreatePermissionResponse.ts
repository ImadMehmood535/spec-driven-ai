import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';

export class CreatePermissionResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'project.create' })
  name!: string;

  @ApiProperty({ example: 'Create a project', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  static fromDomain(permission: Permission): CreatePermissionResponse {
    const response = new CreatePermissionResponse();
    response.id = permission.id as number;
    response.name = permission.name;
    response.description = permission.description;
    response.entityStatus = permission.entityStatus;
    return response;
  }
}
