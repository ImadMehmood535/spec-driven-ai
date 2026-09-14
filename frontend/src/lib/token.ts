const STORAGE_KEY = 'developer-user-module.token';

/** The claims the API signs at login (D-2). */
export interface TokenClaims {
  sub: string;
  username: string;
  role: string | null;
  permissions: string[];
  exp?: number;
  iat?: number;
}

/**
 * Token storage is browser-side (D-10), so a refresh does not force re-login.
 *
 * The accepted consequence: anything running on this page can read it, so an
 * XSS bug becomes a token disclosure. That makes two things requirements
 * rather than preferences — no untrusted HTML is ever rendered, and no
 * third-party script tags are added to this app.
 */
export function storeToken(token: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Private browsing and disabled storage both throw. The session simply
    // does not survive a refresh; it must not crash the app.
  }
}

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — see storeToken.
  }
}

/**
 * Reads the claims out of the JWT payload. This is **not** verification: a
 * browser cannot meaningfully check a signature, and the API is the authority
 * on what a token permits. The claims are read only to decide what to show.
 */
export function decodeClaims(token: string): TokenClaims | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(json) as Partial<TokenClaims>;

    if (typeof parsed.sub !== 'string' || typeof parsed.username !== 'string') {
      return null;
    }

    return {
      sub: parsed.sub,
      username: parsed.username,
      role: parsed.role ?? null,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      exp: parsed.exp,
      iat: parsed.iat,
    };
  } catch {
    // A malformed token is treated as no session rather than crashing.
    return null;
  }
}

/** True when the token carries an expiry that has passed. */
export function isExpired(claims: TokenClaims, now = Date.now()): boolean {
  if (typeof claims.exp !== 'number') {
    return false;
  }
  return claims.exp * 1000 <= now;
}
