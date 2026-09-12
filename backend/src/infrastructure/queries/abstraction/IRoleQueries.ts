export const ROLE_QUERIES = Symbol('ROLE_QUERIES');

export interface RoleReadModel {
  id: number;
  globalUId: string;
  name: string;
  description: string | null;
  entityStatus: string;
  createdAt: string;
  modifiedOn: string | null;
}

export interface RoleListFilter {
  search?: string;
  entityStatus?: string;
  page: number;
  size: number;
}

export interface RoleListResult {
  rows: RoleReadModel[];
  total: number;
}

export interface IRoleQueries {
  findList(filter: RoleListFilter): Promise<RoleListResult>;
  findById(id: number): Promise<RoleReadModel | null>;
}
