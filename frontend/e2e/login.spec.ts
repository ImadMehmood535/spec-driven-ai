import { expect, test } from '@playwright/test';
import { ADMIN_IDENTIFIER, signIn, appAlert } from './helpers';

test.describe('login (FR-UI5, FR-S3)', () => {
  test('the seeded administrator can sign in and reach the app', async ({
    page,
  }) => {
    // This is what closes the §2 bootstrap problem end to end: the first
    // administrator exists before any endpoint can be called.
    await signIn(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: 'Access control' }),
    ).toBeVisible();
  });

  test('an unauthenticated visitor is sent to login', async ({ page }) => {
    await page.goto('/users');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Sign in' }),
    ).toBeVisible();
  });

  test('a wrong password is refused, and reveals nothing', async ({ page }) => {
    await signIn(page, ADMIN_IDENTIFIER, 'definitely-not-the-password');

    // One uniform message — the API makes unknown-user, wrong-password and
    // deactivated indistinguishable, and the UI must not elaborate.
    await expect(appAlert(page)).toHaveText('Invalid credentials.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('an unknown user is refused identically', async ({ page }) => {
    await signIn(page, 'nobody-at-all@example.com', 'any-password-here');

    await expect(appAlert(page)).toHaveText('Invalid credentials.');
  });

  test('signing out returns to login and protects the app again', async ({
    page,
  }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/users');
    await expect(page).toHaveURL(/\/login$/);
  });
});
