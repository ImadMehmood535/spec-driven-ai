export const ROLE_PERMISSION_QUERIES = Symbol('ROLE_PERMISSION_QUERIES');

/** A role's permission, flattened with the permission's own detail (FR-RP3). */
export interface RolePermissionReadModel {
  linkId: number;
  permissionId: number;
  name: string;
  description: string | null;
  permissionStatus: string;
  linkStatus: string;
  createdAt: string;
}

export interface IRolePermissionQueries {
  /** Active links only, unless includeInactive is set. */
  findByRole(
    roleId: number,
    includeInactive?: boolean,
  ): Promise<RolePermissionReadModel[]>;
}
