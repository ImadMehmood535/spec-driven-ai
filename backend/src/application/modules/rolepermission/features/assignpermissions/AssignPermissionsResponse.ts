import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsResponse {
  @ApiProperty({ example: 1 })
  roleId!: number;

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  assigned!: number[];

  static of(roleId: number, assigned: number[]): AssignPermissionsResponse {
    const response = new AssignPermissionsResponse();
    response.roleId = roleId;
    response.assigned = assigned;
    return response;
  }
}
