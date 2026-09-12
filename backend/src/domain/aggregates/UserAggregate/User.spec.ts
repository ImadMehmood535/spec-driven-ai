import { EntityStatus } from '@shared/enums/EntityStatus';
import { DomainError } from '@shared/errors/DomainError';
import { User } from './User';

const PLACEHOLDER_HASH = '$2b$12$placeholderplaceholderplaceholderplaceholder';

const props = (overrides: Partial<Parameters<typeof User.create>[0]> = {}) => ({
  email: 'ahmed@example.com',
  username: 'ahmed',
  firstName: 'Ahmed',
  lastName: 'Khan',
  passwordHash: PLACEHOLDER_HASH,
  roleId: null,
  ...overrides,
});

describe('User.create', () => {
  it('starts active with no id', () => {
    const user = User.create(props());

    expect(user.entityStatus).toBe(EntityStatus.Active);
    expect(user.isActive).toBe(true);
    expect(user.id).toBeNull();
  });

  it('stores the hash it was given, never a plaintext', () => {
    expect(User.create(props()).passwordHash).toBe(PLACEHOLDER_HASH);
  });

  it('requires a password hash — there is no credential-less user', () => {
    expect(() => User.create(props({ passwordHash: '' }))).toThrow(
      'User password hash is required.',
    );
  });

  it('lowercases the email so uniqueness is not case-dependent', () => {
    expect(User.create(props({ email: 'Ahmed@Example.COM' })).email).toBe(
      'ahmed@example.com',
    );
  });

  it.each(['not-an-email', 'missing.at.sign'])(
    'rejects %p as an email',
    (email) => {
      expect(() => User.create(props({ email }))).toThrow(
        'User email is invalid.',
      );
    },
  );

  it.each([
    ['email', 'User email is required.'],
    ['username', 'User username is required.'],
    ['firstName', 'User first name is required.'],
    ['lastName', 'User last name is required.'],
  ])('requires %s', (field, message) => {
    expect(() => User.create(props({ [field]: '   ' }))).toThrow(message);
  });

  it('allows a user with no role (FR-AC4)', () => {
    expect(User.create(props({ roleId: null })).roleId).toBeNull();
  });

  it('accepts a role at creation', () => {
    expect(User.create(props({ roleId: 3 })).roleId).toBe(3);
  });

  it('rejects an invalid role id', () => {
    expect(() => User.create(props({ roleId: 0 }))).toThrow(DomainError);
  });
});

describe('role assignment (§6 — one role per user)', () => {
  it('replaces the existing role rather than accumulating', () => {
    const user = User.create(props({ roleId: 1 }));

    user.assignRole(2);

    expect(user.roleId).toBe(2);
  });

  it('can clear a role back to none', () => {
    const user = User.create(props({ roleId: 1 }));

    user.assignRole(null);

    expect(user.roleId).toBeNull();
  });

  it('exposes roleId as a single value, not a collection', () => {
    const user = User.create(props({ roleId: 1 }));

    expect(Array.isArray(user.roleId)).toBe(false);
    expect(typeof user.roleId).toBe('number');
  });
});

describe('password change (D-9)', () => {
  it('replaces the stored hash', () => {
    const user = User.create(props());
    const next = '$2b$12$adifferentplaceholderadifferentplaceholderxx';

    user.changePasswordHash(next);

    expect(user.passwordHash).toBe(next);
  });

  it('refuses a blank hash', () => {
    expect(() => User.create(props()).changePasswordHash('')).toThrow(
      'User password hash is required.',
    );
  });

  it('has no setter that accepts a plaintext password', () => {
    const user = User.create(props());
    const prototype = Object.getPrototypeOf(user) as object;
    // Write paths only: a method. The passwordHash getter is a read path and
    // exists solely so the repository can persist the value.
    const writePaths = Object.getOwnPropertyNames(prototype).filter((name) => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      return (
        name.toLowerCase().includes('password') &&
        typeof descriptor?.value === 'function'
      );
    });

    // Only changePasswordHash — nothing named for a plaintext password, so a
    // caller cannot accidentally hand the aggregate an unhashed value.
    expect(writePaths).toEqual(['changePasswordHash']);
  });
});

describe('status', () => {
  it('deactivates and reactivates', () => {
    const user = User.create(props());

    user.deactivate();
    expect(user.isActive).toBe(false);

    user.activate();
    expect(user.isActive).toBe(true);
  });

  it('rejects a status outside the enum', () => {
    expect(() =>
      User.create(props()).changeStatus('DRAFT' as EntityStatus),
    ).toThrow('Invalid entity status.');
  });
});

describe('User.rehydrate', () => {
  it('restores every field including the hash', () => {
    const user = User.rehydrate(
      7,
      'ahmed@example.com',
      'ahmed',
      'Ahmed',
      'Khan',
      PLACEHOLDER_HASH,
      3,
      EntityStatus.Inactive,
    );

    expect(user.id).toBe(7);
    expect(user.passwordHash).toBe(PLACEHOLDER_HASH);
    expect(user.roleId).toBe(3);
    expect(user.entityStatus).toBe(EntityStatus.Inactive);
  });
});
