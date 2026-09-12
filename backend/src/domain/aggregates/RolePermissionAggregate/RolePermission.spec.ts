import { EntityStatus } from '@shared/enums/EntityStatus';
import { DomainError } from '@shared/errors/DomainError';
import { RolePermission } from './RolePermission';

describe('RolePermission.create', () => {
  it('starts active', () => {
    expect(
      RolePermission.create({ roleId: 1, permissionId: 2 }).entityStatus,
    ).toBe(EntityStatus.Active);
  });

  it('exposes isActive as a convenience for resolution', () => {
    expect(RolePermission.create({ roleId: 1, permissionId: 2 }).isActive).toBe(
      true,
    );
  });

  it.each([0, -1, 1.5])('rejects role id %p', (roleId) => {
    expect(() => RolePermission.create({ roleId, permissionId: 2 })).toThrow(
      DomainError,
    );
  });

  it.each([0, -1, 1.5])('rejects permission id %p', (permissionId) => {
    expect(() => RolePermission.create({ roleId: 1, permissionId })).toThrow(
      DomainError,
    );
  });
});

describe('D-8 lifecycle', () => {
  it('deactivates on removal rather than being deleted', () => {
    const link = RolePermission.rehydrate(5, 1, 2, EntityStatus.Active);

    link.deactivate();

    expect(link.entityStatus).toBe(EntityStatus.Inactive);
    expect(link.isActive).toBe(false);
    expect(link.id).toBe(5); // the row survives
  });

  it('reactivates the same row on re-assignment', () => {
    const link = RolePermission.rehydrate(5, 1, 2, EntityStatus.Inactive);

    link.activate();

    expect(link.entityStatus).toBe(EntityStatus.Active);
    expect(link.id).toBe(5); // same row, not a new one
  });

  it('is idempotent when removing an already-removed link', () => {
    const link = RolePermission.rehydrate(5, 1, 2, EntityStatus.Inactive);

    link.deactivate();

    expect(link.entityStatus).toBe(EntityStatus.Inactive);
  });

  it('keeps roleId and permissionId immutable across the cycle', () => {
    const link = RolePermission.rehydrate(5, 1, 2, EntityStatus.Active);

    link.deactivate();
    link.activate();

    expect(link.roleId).toBe(1);
    expect(link.permissionId).toBe(2);
  });

  it('rejects a status outside the enum', () => {
    const link = RolePermission.rehydrate(5, 1, 2, EntityStatus.Active);

    expect(() => link.changeStatus('DRAFT' as EntityStatus)).toThrow(
      'Invalid entity status.',
    );
  });
});
