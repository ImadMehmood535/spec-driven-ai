import type { Locator, Page } from '@playwright/test';

export const ADMIN_IDENTIFIER =
  process.env.E2E_ADMIN_IDENTIFIER ?? 'admin@developer.local';
export const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? 'local-dev-admin-password';
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

/**
 * D-11: nothing in this module is deletable, so specs cannot clean up after
 * themselves. Every name they create carries a run-scoped suffix, and each
 * spec asserts only on its own records.
 *
 * Two rules follow, and both are easy to violate without noticing:
 *   - never assert on a total row count, or "the first row"
 *   - never hard-code a name a previous run could have created
 */
const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const unique = (prefix: string) => `${prefix}-${RUN_ID}`;

/**
 * A permission name must match the resource.action shape the catalogue uses —
 * lowercase letters and hyphens only — so the base36 run id cannot be used
 * verbatim. Stripping its digits would shorten it and weaken the uniqueness
 * D-11 depends on, so a letters-only id is generated instead.
 */
const LETTER_RUN_ID = Array.from({ length: 12 }, () =>
  String.fromCharCode(97 + Math.floor(Math.random() * 26)),
).join('');

export const uniquePermission = () => `endtoend.${LETTER_RUN_ID}`;

export async function signIn(
  page: Page,
  identifier = ADMIN_IDENTIFIER,
  password = ADMIN_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email or username').fill(identifier);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for the outcome before returning. Without this a caller that
  // navigates immediately races the token being stored, and the route guard
  // bounces them back to /login.
  await page.waitForFunction(
    () =>
      window.location.pathname !== '/login' ||
      document.querySelector('[role="alert"]:not(#__next-route-announcer__)') !==
        null,
    undefined,
    { timeout: 15_000 },
  );
}

/** Talks to the API directly, for setup a spec needs but is not asserting. */
export async function apiToken(
  identifier = ADMIN_IDENTIFIER,
  password = ADMIN_PASSWORD,
): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    throw new Error(`Could not sign in as ${identifier}`);
  }

  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}

export async function apiPost<T>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPatch(
  path: string,
  token: string,
  body: unknown,
): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`PATCH ${path} failed: ${response.status}`);
  }
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Next renders its own role="alert" route announcer, so a bare
 * getByRole('alert') matches two elements. This selects the application's
 * alerts only.
 */
export function appAlert(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
