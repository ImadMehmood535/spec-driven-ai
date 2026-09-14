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
import { RolesPage } from './RolesPage';
import type { Role } from './types';

const BASE = 'http://localhost:3000';

const role = (overrides: Partial<Role> = {}): Role => ({
  id: 1,
  globalUId: 'uid-1',
  name: 'Developer Admin',
  description: 'Full access',
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
  ...overrides,
});

const ALL = ['role.view', 'role.create', 'role.update'];

const listReturns = (items: Role[]) =>
  server.use(
    http.get(`${BASE}/role`, () =>
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
  );

const renderPage = (permissions: string[] = ALL) =>
  renderWithProviders(
    <PermissionsProvider permissions={permissions}>
      <RolesPage />
    </PermissionsProvider>,
  );

describe('RolesPage — states and listing', () => {
  it('lists roles with their status', async () => {
    listReturns([
      role(),
      role({ id: 2, name: 'Viewer', entityStatus: 'INACTIVE' }),
    ]);
    renderPage();

    expect(await screen.findByText('Developer Admin')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows an empty state that explains the next step', async () => {
    listReturns([]);
    renderPage();

    expect(await screen.findByText('No roles yet')).toBeInTheDocument();
    expect(
      screen.getByText(/assign it the permissions its holders should have/i),
    ).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    server.use(
      http.get(`${BASE}/role`, () =>
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

describe('RolesPage — creating (FR-UI9)', () => {
  it('accepts a human-readable name, not resource.action', async () => {
    listReturns([]);
    let created: unknown = null;
    server.use(
      http.post(`${BASE}/role`, async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(role(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /new role/i }));
    await user.type(screen.getByLabelText(/name/i), 'Developer Manager');
    await user.click(screen.getByRole('button', { name: 'Create role' }));

    await waitFor(() =>
      expect(created).toEqual({
        name: 'Developer Manager',
        description: null,
      }),
    );
  });

  it('shows a duplicate name on the field', async () => {
    listReturns([]);
    server.use(
      http.post(`${BASE}/role`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            message: 'Role "Developer Admin" already exists.',
            error: 'ConflictError',
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /new role/i }));
    await user.type(screen.getByLabelText(/name/i), 'Developer Admin');
    await user.click(screen.getByRole('button', { name: 'Create role' }));

    await waitFor(() =>
      expect(screen.getByLabelText(/name/i)).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
  });
});

describe('RolesPage — deactivation says what is invisible here', () => {
  it('explains that users keep the role but gain nothing from it (FR-AC3)', async () => {
    listReturns([role()]);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: /actions for developer admin/i,
      }),
    );
    await user.click(
      await screen.findByRole('menuitem', { name: 'Deactivate' }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/will grant them no permissions/i),
    ).toBeInTheDocument();
  });
});

describe('RolesPage — no delete (D-5)', () => {
  it('offers Edit, Permissions and a status change only', async () => {
    listReturns([role()]);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: /actions for developer admin/i,
      }),
    );

    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Edit',
      'Permissions',
      'Deactivate',
    ]);
  });
});

describe('RolesPage — gating (FR-UI6)', () => {
  it('hides creation without role.create', async () => {
    listReturns([role()]);
    renderPage(['role.view']);

    await screen.findByText('Developer Admin');
    expect(
      screen.queryByRole('button', { name: /new role/i }),
    ).not.toBeInTheDocument();
  });
});

describe('RolesPage — accessibility', () => {
  it.each(['light', 'dark'] as const)(
    'has no violations in the %s theme',
    async (theme) => {
      listReturns([role()]);
      const { container } = renderWithProviders(
        <PermissionsProvider permissions={ALL}>
          <RolesPage />
        </PermissionsProvider>,
        { theme },
      );

      await screen.findByText('Developer Admin');
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
