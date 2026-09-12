import { RolePermission } from '@domain/aggregates/RolePermissionAggregate/RolePermission';

export const ROLE_PERMISSION_REPOSITORY = Symbol('ROLE_PERMISSION_REPOSITORY');

export interface IRolePermissionRepository {
  /**
   * Assigns several permissions to a role atomically (FR-RP1). Links that
   * already exist but are inactive are reactivated rather than inserted,
   * because UNIQUE(roleId, permissionId) forbids a duplicate (D-8).
   */
  assignMany(roleId: number, permissionIds: number[]): Promise<void>;
  findByRoleAndPermission(
    roleId: number,
    permissionId: number,
  ): Promise<RolePermission | null>;
  updateLink(link: RolePermission): Promise<void>;
  /** Permission ids already actively assigned to the role. */
  activePermissionIds(roleId: number): Promise<number[]>;
}
