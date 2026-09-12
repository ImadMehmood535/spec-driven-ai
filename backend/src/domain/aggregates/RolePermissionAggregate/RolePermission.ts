import { ensureEntityStatus, requiredId } from '@shared/domain/Guards';
import { EntityStatus } from '@shared/enums/EntityStatus';

export interface RolePermissionProps {
  roleId: number;
  permissionId: number;
}

/**
 * The link between a role and a permission. Removal deactivates this row
 * rather than deleting it (D-8), so the UNIQUE(roleId, permissionId)
 * constraint means a later re-assignment reactivates the same row.
 */
export class RolePermission {
  private constructor(
    private readonly _id: number | null,
    private _roleId: number,
    private _permissionId: number,
    private _entityStatus: EntityStatus,
  ) {}

  static create(props: RolePermissionProps): RolePermission {
    const link = new RolePermission(null, 0, 0, EntityStatus.Active);
    link.assignRole(props.roleId);
    link.assignPermission(props.permissionId);
    return link;
  }

  static rehydrate(
    id: number,
    roleId: number,
    permissionId: number,
    entityStatus: EntityStatus,
  ): RolePermission {
    return new RolePermission(id, roleId, permissionId, entityStatus);
  }

  get id(): number | null {
    return this._id;
  }
  get roleId(): number {
    return this._roleId;
  }
  get permissionId(): number {
    return this._permissionId;
  }
  get entityStatus(): EntityStatus {
    return this._entityStatus;
  }
  get isActive(): boolean {
    return this._entityStatus === EntityStatus.Active;
  }

  private assignRole(roleId: number): void {
    this._roleId = requiredId(roleId, 'Role');
  }

  private assignPermission(permissionId: number): void {
    this._permissionId = requiredId(permissionId, 'Permission');
  }

  changeStatus(status: EntityStatus): void {
    this._entityStatus = ensureEntityStatus(status);
  }

  /** Re-assignment of a previously removed permission (D-8). */
  activate(): void {
    this._entityStatus = EntityStatus.Active;
  }

  /** FR-RP2 removal: the row survives, only its status changes (D-8). */
  deactivate(): void {
    this._entityStatus = EntityStatus.Inactive;
  }
}
