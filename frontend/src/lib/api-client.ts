import { ApiError, networkError, toApiError } from './api-error';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Where the token comes from is `ui-auth`'s decision (D-10: client-side
 * browser storage). This is the single seam that attaches it, so that choice
 * lives in one place and every request picks it up.
 */
type TokenGetter = () => string | null;

let getToken: TokenGetter = () => null;

export function setTokenGetter(getter: TokenGetter): void {
  getToken = getter;
}

/** Called when the API rejects the token, so the session can be cleared. */
type UnauthenticatedHandler = () => void;

let onUnauthenticated: UnauthenticatedHandler = () => undefined;

export function setUnauthenticatedHandler(
  handler: UnauthenticatedHandler,
): void {
  onUnauthenticated = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Login has no token yet. */
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, skipAuth = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw networkError();
  }

  if (!response.ok) {
    const parsed = await response.json().catch(() => null);
    const error: ApiError = toApiError(response.status, parsed);

    // 401 clears the session; 403 does not — the user is signed in, just not
    // permitted, and logging them out would be the wrong response.
    if (error.requiresReauthentication) {
      onUnauthenticated();
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toQueryString(query: RequestOptions['query']): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const serialised = params.toString();
  return serialised.length > 0 ? `?${serialised}` : '';
}
