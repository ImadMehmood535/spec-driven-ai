/** Mirrors the API's permission read model. */
export interface Permission {
  id: number;
  globalUId: string;
  name: string;
  description: string | null;
  entityStatus: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  modifiedOn: string | null;
}

export interface PermissionListResponse {
  items: Permission[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PermissionListParams {
  search?: string;
  entityStatus?: string;
  page: number;
  size: number;
}
