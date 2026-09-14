import { http, HttpResponse } from 'msw';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
  within,
} from '@test/render';
import { server } from '@test/msw/server';
import { PermissionsProvider } from '@/hooks/usePermissions';
import { UsersPage } from './UsersPage';
import type { User } from './types';

const BASE = 'http://localhost:3000';
const PASSWORD = 'a-real-password';

const user = (overrides: Partial<User> = {}): User => ({
  id: 1,
  globalUId: 'uid-1',
  email: 'ahmed@example.com',
  username: 'ahmed',
  firstName: 'Ahmed',
  lastName: 'Khan',
  roleId: 1,
  roleName: 'Developer Admin',
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
  ...overrides,
});

const ALL = [
  'user.view',
  'user.create',
  'user.update',
  'user.assign-role',
  'user.change-password',
  'role.view',
];

const listReturns = (items: User[]) =>
  server.use(
    http.get(`${BASE}/user`, () =>
      HttpResponse.json({
        items,
        meta: {
          currentPage: 1,
          pageSize: 20,
          totalItems: items.length,
          totalPages: 1,
        },
      }),
    ),
    http.get(`${BASE}/role`, () =>
      HttpResponse.json({
        items: [
          {
            id: 1,
            globalUId: 'r1',
            name: 'Developer Admin',
            description: null,
            entityStatus: 'ACTIVE',
            createdAt: '2026-09-12T00:00:00.000Z',
            modifiedOn: null,
          },
          {
            id: 2,
            globalUId: 'r2',
            name: 'Developer Viewer',
            description: null,
            entityStatus: 'ACTIVE',
            createdAt: '2026-09-12T00:00:00.000Z',
            modifiedOn: null,
          },
        ],
        meta: { currentPage: 1, pageSize: 50, totalItems: 2, totalPages: 1 },
      }),
    ),
  );

const renderPage = (permissions: string[] = ALL) =>
  renderWithProviders(
    <PermissionsProvider permissions={permissions}>
      <UsersPage />
    </PermissionsProvider>,
  );

const openActions = async (
  ue: ReturnType<typeof userEvent.setup>,
  username = 'ahmed',
) => {
  await ue.click(
    await screen.findByRole('button', { name: `Actions for ${username}` }),
  );
};

describe('UsersPage — listing', () => {
  it('shows the user with their role', async () => {
    listReturns([user()]);
    renderPage();

    expect(await screen.findByText('Ahmed Khan')).toBeInTheDocument();
    expect(screen.getByText('Developer Admin')).toBeInTheDocument();
  });

  it('says "No role" rather than leaving a blank cell (FR-AC4)', async () => {
    // An empty cell reads as missing data; this user genuinely holds nothing.
    listReturns([user({ roleId: null, roleName: null })]);
    renderPage();

    expect(await screen.findByText('No role')).toBeInTheDocument();
  });

  it('shows an empty state explaining the next step', async () => {
    listReturns([]);
    renderPage();

    expect(await screen.findByText('No users yet')).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    server.use(
      http.get(`${BASE}/user`, () =>
        HttpResponse.json(
          { statusCode: 500, message: 'Boom.', error: 'ServerError' },
          { status: 500 },
        ),
      ),
    );
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('UsersPage — creating (NFR-3)', () => {
  it('creates a user and never echoes the password', async () => {
    listReturns([]);
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${BASE}/user`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(user(), { status: 201 });
      }),
    );
    const ue = userEvent.setup();
    const { container } = renderPage();

    await ue.click(await screen.findByRole('button', { name: /new user/i }));
    await ue.type(screen.getByLabelText(/first name/i), 'Ahmed');
    await ue.type(screen.getByLabelText(/last name/i), 'Khan');
    await ue.type(screen.getByLabelText(/email/i), 'ahmed@example.com');
    await ue.type(screen.getByLabelText(/username/i), 'ahmed');
    await ue.type(screen.getByLabelText(/^password/i), PASSWORD);
    await ue.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({ username: 'ahmed', password: PASSWORD });
    // Sent, but never rendered — not in a toast, not anywhere.
    expect(container.textContent).not.toContain(PASSWORD);
  });
});

describe('UsersPage — one role per user (§6)', () => {
  it('offers "Assign role" when the user has none', async () => {
    listReturns([user({ roleId: null, roleName: null })]);
    const ue = userEvent.setup();
    renderPage();

    await openActions(ue);

    expect(
      await screen.findByRole('menuitem', { name: 'Assign role' }),
    ).toBeInTheDocument();
  });

  it('offers "Change role" when they already have one', async () => {
    // Wording matters: it must not imply a second role can be added.
    listReturns([user()]);
    const ue = userEvent.setup();
    renderPage();

    await openActions(ue);

    expect(
      await screen.findByRole('menuitem', { name: 'Change role' }),
    ).toBeInTheDocument();
  });

  it('replaces the role rather than adding one', async () => {
    listReturns([user()]);
    let patched: unknown = null;
    server.use(
      http.patch(`${BASE}/user/1/role`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ userId: 1, roleId: 2 });
      }),
    );
    const ue = userEvent.setup();
    renderPage();

    await openActions(ue);
    await ue.click(
      await screen.findByRole('menuitem', { name: 'Change role' }),
    );
    await ue.click(
      await screen.findByRole('button', { name: /developer viewer/i }),
    );

    // A single scalar — never an array, which would imply multi-role.
    await waitFor(() => expect(patched).toEqual({ roleId: 2 }));
  });

  it('can remove the role entirely', async () => {
    listReturns([user()]);
    let patched: unknown = null;
    server.use(
      http.patch(`${BASE}/user/1/role`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ userId: 1, roleId: null });
      }),
    );
    const ue = userEvent.setup();
    renderPage();

    await openActions(ue);
    await ue.click(
      await screen.findByRole('menuitem', { name: 'Change role' }),
    );
    await ue.click(await screen.findByRole('button', { name: 'Remove role' }));

    await waitFor(() => expect(patched).toEqual({ roleId: null }));
  });
});

describe('UsersPage — changing a password (D-9)', () => {
  it('sends the new password and does not echo it', async () => {
    listReturns([user()]);
    let body: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${BASE}/user/1/password`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ userId: 1, passwordChanged: true });
      }),
    );
    const ue = userEvent.setup();
    const { container } = renderPage();

    await openActions(ue);
    await ue.click(
      await screen.findByRole('menuitem', { name: 'Change password' }),
    );
    await ue.type(screen.getByLabelText(/new password/i), PASSWORD);
    await ue.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => expect(body).toEqual({ newPassword: PASSWORD }));
    expect(container.textContent).not.toContain(PASSWORD);
  });

  it('asks for no current password — an administrator action, not a reset', async () => {
    listReturns([user()]);
    const ue = userEvent.setup();
    renderPage();

    await openActions(ue);
    await ue.click(
      await screen.findByRole('menuitem', { name: 'Change password' }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).queryByLabelText(/current password/i),
    ).not.toBeInTheDocument();
  });
});

describe('UsersPage — deactivation (FR-U7)', () => {
  it('names the real consequence: they cannot sign in', async () => {
    listReturns([user()]);
    const ue = userEvent.setup();
    renderPage();

    await openActions(ue);
    await ue.click(await screen.findByRole('menuitem', { name: 'Deactivate' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/no longer be able to sign in/i),
    ).toBeInTheDocument();
  });
});

describe('UsersPage — no delete (D-5)', () => {
  it('offers only edit, role, password and a status change', async () => {
    listReturns([user()]);
    const ue = userEvent.setup();
    renderPage();

    await openActions(ue);

    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Edit',
      'Change role',
      'Change password',
      'Deactivate',
    ]);
  });
});

describe('UsersPage — gating (FR-UI6)', () => {
  it('hides creation without user.create', async () => {
    listReturns([user()]);
    renderPage(['user.view']);

    await screen.findByText('Ahmed Khan');
    expect(
      screen.queryByRole('button', { name: /new user/i }),
    ).not.toBeInTheDocument();
  });

  it('hides row actions without user.update', async () => {
    listReturns([user()]);
    renderPage(['user.view']);

    await screen.findByText('Ahmed Khan');
    expect(
      screen.queryByRole('button', { name: /actions for/i }),
    ).not.toBeInTheDocument();
  });
});

describe('UsersPage — accessibility', () => {
  it.each(['light', 'dark'] as const)(
    'has no violations in the %s theme',
    async (theme) => {
      listReturns([user()]);
      const { container } = renderWithProviders(
        <PermissionsProvider permissions={ALL}>
          <UsersPage />
        </PermissionsProvider>,
        { theme },
      );

      await screen.findByText('Ahmed Khan');
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
