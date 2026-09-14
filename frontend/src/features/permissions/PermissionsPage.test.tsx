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
import { PermissionsPage } from './PermissionsPage';
import type { Permission } from './types';

const BASE = 'http://localhost:3000';

const permission = (overrides: Partial<Permission> = {}): Permission => ({
  id: 1,
  globalUId: 'uid-1',
  name: 'project.create',
  description: 'Create a project',
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
  ...overrides,
});

const listResponse = (items: Permission[], totalItems = items.length) => ({
  items,
  meta: {
    currentPage: 1,
    pageSize: 20,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / 20)),
  },
});

const ALL = ['permission.view', 'permission.create', 'permission.update'];

const renderPage = (permissions: string[] = ALL) =>
  renderWithProviders(
    <PermissionsProvider permissions={permissions}>
      <PermissionsPage />
    </PermissionsProvider>,
  );

const listReturns = (items: Permission[], totalItems?: number) =>
  server.use(
    http.get(`${BASE}/permission`, () =>
      HttpResponse.json(listResponse(items, totalItems)),
    ),
  );

describe('PermissionsPage — the required states (FR-UI7)', () => {
  it('shows a skeleton while loading', () => {
    server.use(
      http.get(`${BASE}/permission`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(listResponse([]));
      }),
    );
    renderPage();

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('shows an empty state that says how to fill it', async () => {
    listReturns([]);
    renderPage();

    expect(await screen.findByText('No permissions yet')).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    server.use(
      http.get(`${BASE}/permission`, () =>
        HttpResponse.json(
          { statusCode: 500, message: 'Boom.', error: 'ServerError' },
          { status: 500 },
        ),
      ),
    );
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it('lists permissions with their status', async () => {
    listReturns([
      permission(),
      permission({ id: 2, name: 'project.view', entityStatus: 'INACTIVE' }),
    ]);
    renderPage();

    expect(await screen.findByText('project.create')).toBeInTheDocument();
    expect(screen.getByText('project.view')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders a dash for a missing description rather than a blank cell', async () => {
    listReturns([permission({ description: null })]);
    renderPage();

    expect(await screen.findByText('—')).toBeInTheDocument();
  });
});

describe('PermissionsPage — permission gating (FR-UI6)', () => {
  it('offers creation to a user who may create', async () => {
    listReturns([permission()]);
    renderPage();

    expect(
      await screen.findByRole('button', { name: /new permission/i }),
    ).toBeInTheDocument();
  });

  it('hides creation from a user who may not', async () => {
    listReturns([permission()]);
    renderPage(['permission.view']);

    await screen.findByText('project.create');
    expect(
      screen.queryByRole('button', { name: /new permission/i }),
    ).not.toBeInTheDocument();
  });

  it('hides row actions without permission.update', async () => {
    listReturns([permission()]);
    renderPage(['permission.view']);

    await screen.findByText('project.create');
    expect(
      screen.queryByRole('button', { name: /actions for/i }),
    ).not.toBeInTheDocument();
  });
});

describe('PermissionsPage — creating', () => {
  it('creates and reports success', async () => {
    listReturns([]);
    let created: unknown = null;
    server.use(
      http.post(`${BASE}/permission`, async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(permission(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /new permission/i }),
    );
    await user.type(screen.getByLabelText(/name/i), 'project.view');
    await user.click(screen.getByRole('button', { name: 'Create permission' }));

    await waitFor(() =>
      expect(created).toEqual({ name: 'project.view', description: null }),
    );
  });

  it('shows a duplicate name on the field, not as a toast', async () => {
    listReturns([]);
    server.use(
      http.post(`${BASE}/permission`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            message: 'Permission "project.create" already exists.',
            error: 'ConflictError',
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /new permission/i }),
    );
    await user.type(screen.getByLabelText(/name/i), 'project.create');
    await user.click(screen.getByRole('button', { name: 'Create permission' }));

    // Shown where the user can fix it.
    await waitFor(() =>
      expect(screen.getByLabelText(/name/i)).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
  });
});

describe('PermissionsPage — deactivation (FR-UI7, D-5)', () => {
  it('confirms before deactivating, saying what actually changes', async () => {
    listReturns([permission()]);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: /actions for project.create/i,
      }),
    );
    await user.click(
      await screen.findByRole('menuitem', { name: 'Deactivate' }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/stop granting access immediately/i),
    ).toBeInTheDocument();
  });

  it('sends the status change when confirmed', async () => {
    listReturns([permission()]);
    let patched: unknown = null;
    server.use(
      http.patch(`${BASE}/permission/1`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json(permission({ entityStatus: 'INACTIVE' }));
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: /actions for project.create/i,
      }),
    );
    await user.click(
      await screen.findByRole('menuitem', { name: 'Deactivate' }),
    );
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(patched).toEqual({ entityStatus: 'INACTIVE' }));
  });

  it('offers reactivation for an inactive permission', async () => {
    listReturns([permission({ entityStatus: 'INACTIVE' })]);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: /actions for project.create/i,
      }),
    );

    expect(
      await screen.findByRole('menuitem', { name: 'Reactivate' }),
    ).toBeInTheDocument();
  });
});

describe('PermissionsPage — no delete (D-5)', () => {
  it('offers no delete control anywhere', async () => {
    listReturns([permission()]);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', {
        name: /actions for project.create/i,
      }),
    );

    // Deactivation is the only retirement mechanism. Asserting the absence
    // means it cannot be re-added by accident.
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Edit',
      'Deactivate',
    ]);
  });
});

describe('PermissionsPage — accessibility', () => {
  it.each(['light', 'dark'] as const)(
    'has no violations in the %s theme',
    async (theme) => {
      listReturns([permission()]);
      const { container } = renderWithProviders(
        <PermissionsProvider permissions={ALL}>
          <PermissionsPage />
        </PermissionsProvider>,
        { theme },
      );

      await screen.findByText('project.create');
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
