export const PERMISSION_QUERIES = Symbol('PERMISSION_QUERIES');

export interface PermissionReadModel {
  id: number;
  globalUId: string;
  name: string;
  description: string | null;
  entityStatus: string;
  createdAt: string;
  modifiedOn: string | null;
}

export interface PermissionListFilter {
  search?: string;
  entityStatus?: string;
  page: number;
  size: number;
}

export interface PermissionListResult {
  rows: PermissionReadModel[];
  total: number;
}

export interface IPermissionQueries {
  findList(filter: PermissionListFilter): Promise<PermissionListResult>;
  findById(id: number): Promise<PermissionReadModel | null>;
}
