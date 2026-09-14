import { expect, test } from '@playwright/test';
import {
  apiGet,
  apiPatch,
  apiToken,
  signIn,
  unique,
  uniquePermission,
} from './helpers';

/**
 * The flow that only works if every layer agrees: create a permission, create
 * a role, assign one to the other, create a user, give them the role — then
 * confirm the API resolves the permission for that user.
 */
test.describe('full management flow (FR-AC1, FR-AC2, FR-AC3)', () => {
  test('a permission granted through a role resolves for the user', async ({
    page,
  }) => {
    const permissionName = uniquePermission();
    const roleName = unique('E2E Role');
    const username = unique('e2e-user');

    await signIn(page);

    // 1. Create a permission through the UI.
    await page.goto('/permissions');
    await page.getByRole('button', { name: 'New permission' }).click();
    await page.getByLabel('Name').fill(permissionName);
    await page.getByRole('button', { name: 'Create permission' }).click();
    await expect(page.getByText(`Permission "${permissionName}" created.`)).toBeVisible();

    // 2. Create a role.
    await page.goto('/roles');
    await page.getByRole('button', { name: 'New role' }).click();
    await page.getByLabel('Name').fill(roleName);
    await page.getByRole('button', { name: 'Create role' }).click();
    await expect(page.getByText(`Role "${roleName}" created.`)).toBeVisible();

    // 3. Assign the permission to the role.
    await page
      .getByRole('button', { name: `Actions for ${roleName}` })
      .click();
    await page.getByRole('menuitem', { name: 'Permissions' }).click();
    await page.getByLabel('Search permissions').fill(permissionName);
    await page.getByRole('button', { name: permissionName }).click();
    await expect(
      page.getByText(`"${permissionName}" assigned to ${roleName}.`),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    // 4. Create a user.
    await page.goto('/users');
    await page.getByRole('button', { name: 'New user' }).click();
    await page.getByLabel('First name').fill('End');
    await page.getByLabel('Last name').fill('ToEnd');
    await page.getByLabel('Email').fill(`${username}@example.com`);
    await page.getByLabel('Username').fill(username);
    // The label carries a required marker, so getByLabel sees 'Password *'.
    await page.getByLabel(/^Password/).fill('an-e2e-password');
    await page.getByRole('button', { name: 'Create user' }).click();
    await expect(page.getByText(`User "${username}" created.`)).toBeVisible();

    // 5. Give them the role.
    await page.getByRole('button', { name: `Actions for ${username}` }).click();
    await page.getByRole('menuitem', { name: 'Assign role' }).click();
    await page.getByLabel('Search roles').fill(roleName);
    await page.getByRole('button', { name: roleName }).click();
    await expect(
      page.getByText(`${username} now has the ${roleName} role.`),
    ).toBeVisible();

    // 6. The API must now resolve that permission for that user.
    const token = await apiToken();
    const users = await apiGet<{ items: { id: number; username: string }[] }>(
      `/user?search=${username}&page=1&size=20`,
      token,
    );
    const created = users.items.find((item) => item.username === username);
    expect(created).toBeDefined();

    const resolved = await apiGet<{ permissions: string[] }>(
      `/user/${created!.id}/permission`,
      token,
    );
    expect(resolved.permissions).toContain(permissionName);

    // 7. FR-AC3: deactivating the permission removes it, even though the role
    // and the link are untouched. This is the assertion that crosses every
    // layer, and the one most likely to be implemented partially.
    const permissions = await apiGet<{ items: { id: number; name: string }[] }>(
      `/permission?search=${permissionName}&page=1&size=20`,
      token,
    );
    const createdPermission = permissions.items.find(
      (item) => item.name === permissionName,
    );
    expect(createdPermission).toBeDefined();

    await apiPatch(`/permission/${createdPermission!.id}`, token, {
      entityStatus: 'INACTIVE',
    });

    const afterDeactivation = await apiGet<{ permissions: string[] }>(
      `/user/${created!.id}/permission`,
      token,
    );
    expect(afterDeactivation.permissions).not.toContain(permissionName);

    // And reactivating restores it, so the exclusion was the gate working
    // rather than data being destroyed.
    await apiPatch(`/permission/${createdPermission!.id}`, token, {
      entityStatus: 'ACTIVE',
    });
    const afterReactivation = await apiGet<{ permissions: string[] }>(
      `/user/${created!.id}/permission`,
      token,
    );
    expect(afterReactivation.permissions).toContain(permissionName);
  });
});
