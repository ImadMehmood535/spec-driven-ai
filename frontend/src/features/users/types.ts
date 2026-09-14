/** Mirrors the API's user read model, which has no passwordHash field. */
export interface User {
  id: number;
  globalUId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roleId: number | null;
  roleName: string | null;
  entityStatus: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  modifiedOn: string | null;
}

export interface UserListResponse {
  items: User[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface UserListParams {
  search?: string;
  entityStatus?: string;
  roleId?: number;
  page: number;
  size: number;
}
