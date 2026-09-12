import { redact, redactedBody } from './Redaction';

describe('redact', () => {
  it('replaces a password value', () => {
    expect(redact({ username: 'ahmed', password: 'hunter2' })).toEqual({
      username: 'ahmed',
      password: '[REDACTED]',
    });
  });

  it.each([
    'password',
    'newPassword',
    'currentPassword',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'secret',
    'jwtSecret',
  ])('redacts %s', (field) => {
    const result = redact({ [field]: 'sensitive' }) as Record<string, unknown>;
    expect(result[field]).toBe('[REDACTED]');
  });

  it('matches field names case-insensitively', () => {
    expect(redact({ PASSWORD: 'hunter2' })).toEqual({
      PASSWORD: '[REDACTED]',
    });
  });

  it('leaves a similarly-named non-credential field alone', () => {
    expect(redact({ passwordPolicyEnabled: true })).toEqual({
      passwordPolicyEnabled: true,
    });
  });

  it('redacts inside nested objects', () => {
    expect(redact({ user: { email: 'a@b.c', password: 'hunter2' } })).toEqual({
      user: { email: 'a@b.c', password: '[REDACTED]' },
    });
  });

  it('redacts inside arrays of objects', () => {
    expect(redact({ users: [{ password: 'a' }, { password: 'b' }] })).toEqual({
      users: [{ password: '[REDACTED]' }, { password: '[REDACTED]' }],
    });
  });

  it('does not mutate the input', () => {
    const input = { password: 'hunter2' };
    redact(input);
    expect(input.password).toBe('hunter2');
  });

  it.each([null, 42, 'text', true, undefined])(
    'returns the primitive %p unchanged',
    (value) => {
      expect(redact(value)).toBe(value);
    },
  );

  it('tolerates a circular reference', () => {
    const input: Record<string, unknown> = { name: 'loop' };
    input.self = input;

    expect(redact(input)).toEqual({ name: 'loop', self: '[CIRCULAR]' });
  });
});

describe('redactedBody', () => {
  it('serialises a redacted body', () => {
    expect(redactedBody({ password: 'hunter2' })).toBe(
      '{"password":"[REDACTED]"}',
    );
  });

  it.each([undefined, null])('renders %p as an empty object', (value) => {
    expect(redactedBody(value)).toBe('{}');
  });

  it('never leaks the original secret into the output', () => {
    expect(
      redactedBody({ nested: { token: 'super-secret-value' } }),
    ).not.toContain('super-secret-value');
  });
});
