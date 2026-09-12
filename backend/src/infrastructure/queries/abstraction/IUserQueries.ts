export const USER_QUERIES = Symbol('USER_QUERIES');

/**
 * Deliberately has **no** `passwordHash` field. Being absent from the type is
 * stronger than remembering to strip it before serialising (NFR-3).
 */
export interface UserReadModel {
  id: number;
  globalUId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roleId: number | null;
  roleName: string | null;
  entityStatus: string;
  createdAt: string;
  modifiedOn: string | null;
}

export interface UserListFilter {
  search?: string;
  entityStatus?: string;
  roleId?: number;
  page: number;
  size: number;
}

export interface UserListResult {
  rows: UserReadModel[];
  total: number;
}

export interface IUserQueries {
  findList(filter: UserListFilter): Promise<UserListResult>;
  findById(id: number): Promise<UserReadModel | null>;
}
