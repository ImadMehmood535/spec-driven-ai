import { ApiProperty } from '@nestjs/swagger';
import { UserReadModel } from '@infrastructure/queries/abstraction/IUserQueries';

/** Mirrors UserReadModel, which has no passwordHash field (NFR-3). */
export class GetUserResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'a3f1c2e4-5b6d-4e7f-8a9b-0c1d2e3f4a5b' })
  globalUId!: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  email!: string;

  @ApiProperty({ example: 'ahmed' })
  username!: string;

  @ApiProperty({ example: 'Ahmed' })
  firstName!: string;

  @ApiProperty({ example: 'Khan' })
  lastName!: string;

  @ApiProperty({ example: 1, nullable: true })
  roleId!: number | null;

  @ApiProperty({ example: 'Developer Admin', nullable: true })
  roleName!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  entityStatus!: string;

  @ApiProperty({ example: '2026-09-12T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: null, nullable: true })
  modifiedOn!: string | null;

  static from(row: UserReadModel): GetUserResponse {
    const response = new GetUserResponse();
    Object.assign(response, row);
    return response;
  }
}
