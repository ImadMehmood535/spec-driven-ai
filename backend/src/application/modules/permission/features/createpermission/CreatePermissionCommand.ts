import { ICommand } from '@nestjs/cqrs';

export class CreatePermissionCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
  ) {}
}
