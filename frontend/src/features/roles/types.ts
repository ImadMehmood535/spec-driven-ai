export interface Role {
  id: number;
  globalUId: string;
  name: string;
  description: string | null;
  entityStatus: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  modifiedOn: string | null;
}

export interface RoleListResponse {
  items: Role[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** A permission as it appears on a role (FR-RP3): detail, not a bare id. */
export interface RolePermission {
  linkId: number;
  permissionId: number;
  name: string;
  description: string | null;
  permissionStatus: string;
  linkStatus: string;
  createdAt: string;
}

export interface RolePermissionsResponse {
  roleId: number;
  items: RolePermission[];
}
