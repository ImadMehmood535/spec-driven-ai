import {
  ensureEntityStatus,
  optionalText,
  requiredText,
} from '@shared/domain/Guards';
import { EntityStatus } from '@shared/enums/EntityStatus';

const NAME_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 512;

export interface RoleProps {
  name: string;
  description: string | null;
}

export class Role {
  private constructor(
    private readonly _id: number | null,
    private _name: string,
    private _description: string | null,
    private _entityStatus: EntityStatus,
  ) {}

  static create(props: RoleProps): Role {
    const role = new Role(null, '', null, EntityStatus.Active);
    role.rename(props.name);
    role.changeDescription(props.description);
    return role;
  }

  static rehydrate(
    id: number,
    name: string,
    description: string | null,
    entityStatus: EntityStatus,
  ): Role {
    return new Role(id, name, description, entityStatus);
  }

  get id(): number | null {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | null {
    return this._description;
  }
  get entityStatus(): EntityStatus {
    return this._entityStatus;
  }

  /** The role's name, e.g. "Developer Admin" (§5 example). */
  rename(name: string): void {
    this._name = requiredText(name, 'Role name', NAME_MAX_LENGTH);
  }

  changeDescription(description: string | null): void {
    this._description = optionalText(
      description,
      'Role description',
      DESCRIPTION_MAX_LENGTH,
    );
  }

  changeStatus(status: EntityStatus): void {
    this._entityStatus = ensureEntityStatus(status);
  }

  activate(): void {
    this._entityStatus = EntityStatus.Active;
  }

  deactivate(): void {
    this._entityStatus = EntityStatus.Inactive;
  }
}
