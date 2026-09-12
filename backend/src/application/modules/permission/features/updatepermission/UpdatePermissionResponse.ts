import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';

export class UpdatePermissionResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'project.update' })
  name!: string;

  @ApiProperty({ example: 'Update a project', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  static fromDomain(permission: Permission): UpdatePermissionResponse {
    const response = new UpdatePermissionResponse();
    response.id = permission.id as number;
    response.name = permission.name;
    response.description = permission.description;
    response.entityStatus = permission.entityStatus;
    return response;
  }
}
