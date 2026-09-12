import { Permission } from '@domain/aggregates/PermissionAggregate/Permission';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface IPermissionRepository {
  save(permission: Permission): Promise<Permission>;
  updatePermission(permission: Permission): Promise<void>;
  findById(id: number): Promise<Permission | null>;
  nameExists(name: string, exceptId?: number): Promise<boolean>;
}
