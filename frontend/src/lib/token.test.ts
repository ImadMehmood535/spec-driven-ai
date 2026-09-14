import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearToken,
  decodeClaims,
  isExpired,
  readToken,
  storeToken,
  type TokenClaims,
} from './token';

const encode = (payload: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const claims = {
  sub: 'uid-1',
  username: 'ahmed',
  role: 'Developer Admin',
  permissions: ['user.view'],
};

afterEach(() => {
  clearToken();
  vi.unstubAllGlobals();
});

describe('storage', () => {
  it('round-trips a token', () => {
    storeToken('a.b.c');

    expect(readToken()).toBe('a.b.c');
  });

  it('returns null when nothing is stored', () => {
    expect(readToken()).toBeNull();
  });

  it('clears the token', () => {
    storeToken('a.b.c');
    clearToken();

    expect(readToken()).toBeNull();
  });

  it('survives storage being unavailable', () => {
    // Private browsing throws on access. Losing the session across a refresh
    // is acceptable; crashing the app is not.
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    });

    expect(() => storeToken('a.b.c')).not.toThrow();
    expect(readToken()).toBeNull();
    expect(() => clearToken()).not.toThrow();
  });
});

describe('decodeClaims', () => {
  it('reads the claims the API signs', () => {
    expect(decodeClaims(encode(claims))).toMatchObject(claims);
  });

  it('defaults a missing role to null (FR-AC4)', () => {
    expect(
      decodeClaims(encode({ ...claims, role: undefined }))?.role,
    ).toBeNull();
  });

  it('defaults missing permissions to an empty list', () => {
    const decoded = decodeClaims(encode({ ...claims, permissions: undefined }));

    expect(decoded?.permissions).toEqual([]);
  });

  it.each([
    ['not-a-token', 'no segments'],
    ['only.two', 'no payload to parse'],
    ['header.!!!not-base64!!!.sig', 'undecodable payload'],
    ['', 'empty'],
  ])('treats %p as no session (%s)', (token) => {
    // A malformed token must not white-screen the app.
    expect(decodeClaims(token)).toBeNull();
  });

  it('rejects a payload missing the identity claims', () => {
    expect(decodeClaims(encode({ permissions: [] }))).toBeNull();
  });
});

describe('isExpired', () => {
  const at = (exp: number): TokenClaims => ({ ...claims, exp });

  it('is false for a token expiring in the future', () => {
    expect(isExpired(at(2_000), 1_000_000)).toBe(false);
  });

  it('is true once the expiry has passed', () => {
    expect(isExpired(at(1_000), 2_000_000)).toBe(true);
  });

  it('treats the exact expiry moment as expired', () => {
    expect(isExpired(at(1_000), 1_000_000)).toBe(true);
  });

  it('treats a token with no expiry as not expired', () => {
    expect(isExpired({ ...claims })).toBe(false);
  });
});
