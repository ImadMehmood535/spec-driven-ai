import { EntityStatus } from '@shared/enums/EntityStatus';
import { DomainError } from '@shared/errors/DomainError';
import {
  ensureEntityStatus,
  optionalId,
  optionalText,
  requiredId,
  requiredText,
} from './Guards';

describe('requiredId', () => {
  it('returns a positive integer unchanged', () => {
    expect(requiredId(7, 'Role id')).toBe(7);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects %p', (value) => {
    expect(() => requiredId(value, 'Role id')).toThrow(DomainError);
  });

  it('names the field in the message', () => {
    expect(() => requiredId(0, 'Role id')).toThrow('Role id is required.');
  });
});

describe('optionalId', () => {
  it.each([null, undefined])('treats %p as absent', (value) => {
    expect(optionalId(value, 'User role')).toBeNull();
  });

  it('returns a positive integer unchanged', () => {
    expect(optionalId(3, 'User role')).toBe(3);
  });

  it.each([0, -2, 2.5])('rejects %p as invalid', (value) => {
    expect(() => optionalId(value, 'User role')).toThrow(
      'User role is invalid.',
    );
  });
});

describe('requiredText', () => {
  it('trims surrounding whitespace', () => {
    expect(requiredText('  Developer Admin  ', 'Role name', 50)).toBe(
      'Developer Admin',
    );
  });

  it('rejects an empty string', () => {
    expect(() => requiredText('', 'Role name', 50)).toThrow(
      'Role name is required.',
    );
  });

  it('rejects whitespace that trims to nothing', () => {
    expect(() => requiredText('   ', 'Role name', 50)).toThrow(
      'Role name is required.',
    );
  });

  it('rejects text longer than the maximum', () => {
    expect(() => requiredText('abcdef', 'Role name', 5)).toThrow(
      'Role name must be 5 characters or fewer.',
    );
  });

  it('accepts text exactly at the maximum', () => {
    expect(requiredText('abcde', 'Role name', 5)).toBe('abcde');
  });

  it('measures length after trimming', () => {
    expect(requiredText('  abcde  ', 'Role name', 5)).toBe('abcde');
  });
});

describe('optionalText', () => {
  it.each([null, undefined])('treats %p as absent', (value) => {
    expect(optionalText(value, 'Description', 50)).toBeNull();
  });

  it('treats a blank string as absent rather than an error', () => {
    expect(optionalText('   ', 'Description', 50)).toBeNull();
  });

  it('trims and returns present text', () => {
    expect(optionalText('  text  ', 'Description', 50)).toBe('text');
  });

  it('rejects text longer than the maximum', () => {
    expect(() => optionalText('abcdef', 'Description', 5)).toThrow(
      'Description must be 5 characters or fewer.',
    );
  });
});

describe('ensureEntityStatus', () => {
  it.each([EntityStatus.Active, EntityStatus.Inactive])(
    'accepts %s',
    (status) => {
      expect(ensureEntityStatus(status)).toBe(status);
    },
  );

  it('rejects a value outside the enum', () => {
    expect(() => ensureEntityStatus('DRAFT' as EntityStatus)).toThrow(
      'Invalid entity status.',
    );
  });
});
