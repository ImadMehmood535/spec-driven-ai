import {
  ensureEntityStatus,
  optionalText,
  requiredText,
} from '@shared/domain/Guards';
import { EntityStatus } from '@shared/enums/EntityStatus';

const NAME_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 512;

export interface PermissionProps {
  name: string;
  description: string | null;
}

export class Permission {
  private constructor(
    private readonly _id: number | null,
    private _name: string,
    private _description: string | null,
    private _entityStatus: EntityStatus,
  ) {}

  static create(props: PermissionProps): Permission {
    const permission = new Permission(null, '', null, EntityStatus.Active);
    permission.rename(props.name);
    permission.changeDescription(props.description);
    return permission;
  }

  static rehydrate(
    id: number,
    name: string,
    description: string | null,
    entityStatus: EntityStatus,
  ): Permission {
    return new Permission(id, name, description, entityStatus);
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

  /** The action this permission grants, e.g. `project.create` (FR-P5). */
  rename(name: string): void {
    this._name = requiredText(name, 'Permission name', NAME_MAX_LENGTH);
  }

  changeDescription(description: string | null): void {
    this._description = optionalText(
      description,
      'Permission description',
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
