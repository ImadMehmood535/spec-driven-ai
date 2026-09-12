const REDACTED = '[REDACTED]';

/**
 * Field names whose values must never reach a log. Matched case-insensitively
 * against the whole key, so `passwordHash` and `PASSWORD` both redact while a
 * field like `passwordPolicyEnabled` does not.
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'passwordconfirmation',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'jwtsecret',
]);

function isSensitive(key: string): boolean {
  return SENSITIVE_FIELDS.has(key.toLowerCase());
}

/**
 * Returns a copy of `value` with every sensitive field replaced by a placeholder.
 * The input is never mutated. Cycles are tolerated — a repeated reference is
 * emitted as '[CIRCULAR]' rather than recursing forever.
 */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[CIRCULAR]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, seen));
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    result[key] = isSensitive(key) ? REDACTED : redact(source[key], seen);
  }
  return result;
}

/**
 * Formats a request body for logging. Returns '{}' for an absent body so a log
 * line is never the string 'undefined'.
 */
export function redactedBody(body: unknown): string {
  if (body === undefined || body === null) {
    return '{}';
  }
  return JSON.stringify(redact(body));
}
