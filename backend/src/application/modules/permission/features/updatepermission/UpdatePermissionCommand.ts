import { ICommand } from '@nestjs/cqrs';
import { EntityStatus } from '@shared/enums/EntityStatus';

export class UpdatePermissionCommand implements ICommand {
  constructor(
    public readonly id: number,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly entityStatus?: EntityStatus,
  ) {}
}
