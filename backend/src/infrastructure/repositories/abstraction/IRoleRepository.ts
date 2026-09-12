import { Role } from '@domain/aggregates/RoleAggregate/Role';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface IRoleRepository {
  save(role: Role): Promise<Role>;
  updateRole(role: Role): Promise<void>;
  findById(id: number): Promise<Role | null>;
  nameExists(name: string, exceptId?: number): Promise<boolean>;
}
