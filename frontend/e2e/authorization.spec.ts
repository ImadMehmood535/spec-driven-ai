import { expect, test } from '@playwright/test';
import {
  apiGet,
  apiPost,
  apiToken,
  signIn,
  unique,
  ADMIN_IDENTIFIER,
  appAlert,
} from './helpers';

const LIMITED_PASSWORD = 'a-limited-user-password';

/**
 * A user whose role grants only `permission.view` should be able to reach the
 * permissions screen and nothing else. This is FR-AC6 and FR-AC7 observed from
 * the interface rather than from curl.
 */
test.describe('authorization (FR-AC5, FR-AC6, FR-AC7, FR-UI6)', () => {
  test('a limited user sees only what their role allows', async ({ page }) => {
    const roleName = unique('E2E Viewer');
    const username = unique('e2e-viewer');

    const token = await apiToken();

    // Setup through the API — this spec asserts on the UI, not on setup.
    const role = await apiPost<{ id: number }>('/role', token, {
      name: roleName,
      description: 'Can view permissions only',
    });

    const catalogue = await apiGet<{ items: { id: number; name: string }[] }>(
      '/permission?page=1&size=100',
      token,
    );
    const viewPermission = catalogue.items.find(
      (item) => item.name === 'permission.view',
    );
    expect(
      viewPermission,
      'the seed should have created permission.view',
    ).toBeDefined();

    await apiPost(`/role/${role.id}/permission`, token, {
      permissionIds: [viewPermission!.id],
    });

    await apiPost('/user', token, {
      email: `${username}@example.com`,
      username,
      firstName: 'Limited',
      lastName: 'Viewer',
      password: LIMITED_PASSWORD,
      roleId: role.id,
    });

    // Now sign in as them.
    await signIn(page, username, LIMITED_PASSWORD);
    await expect(page).toHaveURL(/\/$/);

    // They hold permission.view, so the permissions list loads...
    await page.goto('/permissions');
    await expect(
      page.getByRole('heading', { name: 'Permissions' }),
    ).toBeVisible();

    // ...but FR-UI6 hides what they cannot do. Creating requires
    // permission.create, which this role does not grant.
    await expect(
      page.getByRole('button', { name: 'New permission' }),
    ).toHaveCount(0);

    // And the users list is refused outright — they lack user.view, so the
    // API returns 403 and the screen shows the error rather than the data.
    await page.goto('/users');
    await expect(appAlert(page)).toBeVisible();
    await expect(appAlert(page)).toContainText(/permission/i);
  });

  test('a 403 does not sign the user out', async ({ page }) => {
    const username = unique('e2e-stay');
    const token = await apiToken();

    const role = await apiPost<{ id: number }>('/role', token, {
      name: unique('E2E StayIn'),
      description: null,
    });
    const catalogue = await apiGet<{ items: { id: number; name: string }[] }>(
      '/permission?page=1&size=100',
      token,
    );
    const viewPermission = catalogue.items.find(
      (item) => item.name === 'permission.view',
    );
    await apiPost(`/role/${role.id}/permission`, token, {
      permissionIds: [viewPermission!.id],
    });
    await apiPost('/user', token, {
      email: `${username}@example.com`,
      username,
      firstName: 'Stay',
      lastName: 'SignedIn',
      password: LIMITED_PASSWORD,
      roleId: role.id,
    });

    await signIn(page, username, LIMITED_PASSWORD);

    // Hitting a route they cannot use must not end the session — being
    // unpermitted is not being unauthenticated.
    await page.goto('/users');
    await expect(appAlert(page)).toBeVisible();

    await page.goto('/permissions');
    await expect(
      page.getByRole('heading', { name: 'Permissions' }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('the seeded administrator reaches every screen (FR-S7, D-7)', async ({
    page,
  }) => {
    await signIn(page, ADMIN_IDENTIFIER);

    for (const [path, heading] of [
      ['/users', 'Users'],
      ['/roles', 'Roles'],
      ['/permissions', 'Permissions'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      // No error state anywhere — the admin holds every permission.
      await expect(appAlert(page)).toHaveCount(0);
    }
  });
});
