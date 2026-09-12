import { EntityStatus } from '@shared/enums/EntityStatus';
import { DomainError } from '@shared/errors/DomainError';
import { Role } from './Role';

describe('Role.create', () => {
  it('starts active', () => {
    const role = Role.create({
      name: 'Developer Admin',
      description: null,
    });

    expect(role.entityStatus).toBe(EntityStatus.Active);
  });

  it('has no id until saved', () => {
    expect(
      Role.create({ name: 'Developer Viewer', description: null }).id,
    ).toBeNull();
  });

  it('trims the name', () => {
    expect(
      Role.create({ name: '  Developer Viewer  ', description: null }).name,
    ).toBe('Developer Viewer');
  });

  it('keeps a human-readable role name intact', () => {
    expect(
      Role.create({ name: 'Developer Owner', description: null }).name,
    ).toBe('Developer Owner');
  });

  it.each(['', '   '])('rejects a blank name (%p)', (name) => {
    expect(() => Role.create({ name, description: null })).toThrow(
      'Role name is required.',
    );
  });

  it('rejects a name over 255 characters', () => {
    expect(() =>
      Role.create({ name: 'a'.repeat(256), description: null }),
    ).toThrow(DomainError);
  });

  it('treats a blank description as absent', () => {
    expect(
      Role.create({ name: 'Developer Viewer', description: '   ' }).description,
    ).toBeNull();
  });

  it('rejects a description over 512 characters', () => {
    expect(() =>
      Role.create({
        name: 'Developer Viewer',
        description: 'a'.repeat(513),
      }),
    ).toThrow(DomainError);
  });
});

describe('Role.rehydrate', () => {
  it('restores every field without re-validating', () => {
    const role = Role.rehydrate(
      7,
      'Developer Manager',
      'Update a project',
      EntityStatus.Inactive,
    );

    expect(role.id).toBe(7);
    expect(role.name).toBe('Developer Manager');
    expect(role.description).toBe('Update a project');
    expect(role.entityStatus).toBe(EntityStatus.Inactive);
  });
});

describe('mutation', () => {
  const role = () =>
    Role.create({ name: 'Developer Viewer', description: null });

  it('renames through the guard', () => {
    const p = role();
    p.rename('  Developer Lead  ');
    expect(p.name).toBe('Developer Lead');
  });

  it('refuses a blank rename', () => {
    expect(() => role().rename('')).toThrow('Role name is required.');
  });

  it('deactivates and reactivates', () => {
    const p = role();

    p.deactivate();
    expect(p.entityStatus).toBe(EntityStatus.Inactive);

    p.activate();
    expect(p.entityStatus).toBe(EntityStatus.Active);
  });

  it('accepts a valid status through changeStatus', () => {
    const p = role();
    p.changeStatus(EntityStatus.Inactive);
    expect(p.entityStatus).toBe(EntityStatus.Inactive);
  });

  it('rejects a status outside the enum', () => {
    expect(() => role().changeStatus('DRAFT' as EntityStatus)).toThrow(
      'Invalid entity status.',
    );
  });
});
