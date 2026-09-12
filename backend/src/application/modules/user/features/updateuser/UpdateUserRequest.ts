import { ApiProperty } from '@nestjs/swagger';
import { EntityStatus } from '@shared/enums/EntityStatus';

/**
 * Deliberately has no password field. A password arriving in a general-purpose
 * PATCH body would be an unexpected credential in an unexpected place; use
 * PATCH /user/:id/password instead (D-9).
 */
export class UpdateUserRequest {
  @ApiProperty({ example: 'ahmed@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'ahmed', required: false })
  username?: string;

  @ApiProperty({ example: 'Ahmed', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Khan', required: false })
  lastName?: string;

  @ApiProperty({
    example: 'INACTIVE',
    required: false,
    enum: EntityStatus,
    description: 'Activate or deactivate the user (FR-U4)',
  })
  entityStatus?: EntityStatus;
}
