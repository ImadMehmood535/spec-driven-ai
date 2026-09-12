import { IQuery } from '@nestjs/cqrs';

export class GetUserPermissionsQuery implements IQuery {
  constructor(public readonly userId: number) {}
}
