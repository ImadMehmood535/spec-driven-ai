import { EntityStatus } from '@shared/enums/EntityStatus';
import { DomainError } from '@shared/errors/DomainError';
import { Permission } from './Permission';

describe('Permission.create', () => {
  it('starts active', () => {
    const permission = Permission.create({
      name: 'project.create',
      description: null,
    });

    expect(permission.entityStatus).toBe(EntityStatus.Active);
  });

  it('has no id until saved', () => {
    expect(
      Permission.create({ name: 'project.view', description: null }).id,
    ).toBeNull();
  });

  it('trims the name', () => {
    expect(
      Permission.create({ name: '  project.view  ', description: null }).name,
    ).toBe('project.view');
  });

  it('keeps an action-style name intact (FR-P5)', () => {
    expect(
      Permission.create({ name: 'project.delete', description: null }).name,
    ).toBe('project.delete');
  });

  it.each(['', '   '])('rejects a blank name (%p)', (name) => {
    expect(() => Permission.create({ name, description: null })).toThrow(
      'Permission name is required.',
    );
  });

  it('rejects a name over 255 characters', () => {
    expect(() =>
      Permission.create({ name: 'a'.repeat(256), description: null }),
    ).toThrow(DomainError);
  });

  it('treats a blank description as absent', () => {
    expect(
      Permission.create({ name: 'project.view', description: '   ' })
        .description,
    ).toBeNull();
  });

  it('rejects a description over 512 characters', () => {
    expect(() =>
      Permission.create({
        name: 'project.view',
        description: 'a'.repeat(513),
      }),
    ).toThrow(DomainError);
  });
});

describe('Permission.rehydrate', () => {
  it('restores every field without re-validating', () => {
    const permission = Permission.rehydrate(
      7,
      'project.update',
      'Update a project',
      EntityStatus.Inactive,
    );

    expect(permission.id).toBe(7);
    expect(permission.name).toBe('project.update');
    expect(permission.description).toBe('Update a project');
    expect(permission.entityStatus).toBe(EntityStatus.Inactive);
  });
});

describe('mutation', () => {
  const permission = () =>
    Permission.create({ name: 'project.view', description: null });

  it('renames through the guard', () => {
    const p = permission();
    p.rename('  project.list  ');
    expect(p.name).toBe('project.list');
  });

  it('refuses a blank rename', () => {
    expect(() => permission().rename('')).toThrow(
      'Permission name is required.',
    );
  });

  it('deactivates and reactivates', () => {
    const p = permission();

    p.deactivate();
    expect(p.entityStatus).toBe(EntityStatus.Inactive);

    p.activate();
    expect(p.entityStatus).toBe(EntityStatus.Active);
  });

  it('accepts a valid status through changeStatus', () => {
    const p = permission();
    p.changeStatus(EntityStatus.Inactive);
    expect(p.entityStatus).toBe(EntityStatus.Inactive);
  });

  it('rejects a status outside the enum', () => {
    expect(() => permission().changeStatus('DRAFT' as EntityStatus)).toThrow(
      'Invalid entity status.',
    );
  });
});
