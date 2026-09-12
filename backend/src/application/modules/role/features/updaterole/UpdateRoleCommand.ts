import { ICommand } from '@nestjs/cqrs';
import { EntityStatus } from '@shared/enums/EntityStatus';

export class UpdateRoleCommand implements ICommand {
  constructor(
    public readonly id: number,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly entityStatus?: EntityStatus,
  ) {}
}
