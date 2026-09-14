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
import { RolePermissionsDialog } from './RolePermissionsDialog';
import type { Role, RolePermission } from './types';

const BASE = 'http://localhost:3000';

const role: Role = {
  id: 1,
  globalUId: 'uid-1',
  name: 'Developer Admin',
  description: null,
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
};

const assignedPermission = (
  overrides: Partial<RolePermission> = {},
): RolePermission => ({
  linkId: 1,
  permissionId: 1,
  name: 'project.create',
  description: null,
  permissionStatus: 'ACTIVE',
  linkStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  ...overrides,
});

const cataloguePermission = (id: number, name: string) => ({
  id,
  globalUId: `uid-${id}`,
  name,
  description: null,
  entityStatus: 'ACTIVE' as const,
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
});

const ALL = [
  'role-permission.view',
  'role-permission.assign',
  'role-permission.remove',
];

const setup = ({
  assigned = [assignedPermission()],
  catalogue = [
    cataloguePermission(1, 'project.create'),
    cataloguePermission(2, 'project.view'),
    cataloguePermission(3, 'project.delete'),
  ],
  permissions = ALL,
}: {
  assigned?: RolePermission[];
  catalogue?: ReturnType<typeof cataloguePermission>[];
  permissions?: string[];
} = {}) => {
  server.use(
    http.get(`${BASE}/role/1/permission`, () =>
      HttpResponse.json({ roleId: 1, items: assigned }),
    ),
    http.get(`${BASE}/permission`, () =>
      HttpResponse.json({
        items: catalogue,
        meta: {
          currentPage: 1,
          pageSize: 50,
          totalItems: catalogue.length,
          totalPages: 1,
        },
      }),
    ),
  );

  return renderWithProviders(
    <PermissionsProvider permissions={permissions}>
      <RolePermissionsDialog role={role} onOpenChange={() => undefined} />
    </PermissionsProvider>,
  );
};

describe('RolePermissionsDialog — viewing (FR-UI4, FR-RP3)', () => {
  it('lists the permissions assigned to the role', async () => {
    setup();

    const assigned = await screen.findByRole('region', { name: 'Assigned' });

    // The section renders while the request is in flight, so the text must be
    // awaited inside it rather than queried synchronously.
    expect(
      await within(assigned).findByText('project.create'),
    ).toBeInTheDocument();
  });

  it('shows an empty state when the role grants nothing', async () => {
    setup({ assigned: [] });

    expect(await screen.findByText('No permissions')).toBeInTheDocument();
    expect(
      screen.getByText(/grants nothing until you assign/i),
    ).toBeInTheDocument();
  });

  it('shows an error with retry if the role permissions fail to load', async () => {
    server.use(
      http.get(`${BASE}/role/1/permission`, () =>
        HttpResponse.json(
          { statusCode: 500, message: 'Boom.', error: 'ServerError' },
          { status: 500 },
        ),
      ),
      http.get(`${BASE}/permission`, () =>
        HttpResponse.json({
          items: [],
          meta: { currentPage: 1, pageSize: 50, totalItems: 0, totalPages: 1 },
        }),
      ),
    );
    renderWithProviders(
      <PermissionsProvider permissions={ALL}>
        <RolePermissionsDialog role={role} onOpenChange={() => undefined} />
      </PermissionsProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not load this role's permissions/i,
    );
  });
});

describe('RolePermissionsDialog — assigning (FR-RP1)', () => {
  it('offers only permissions the role does not already hold', async () => {
    setup();

    const available = await screen.findByRole('region', { name: 'Available' });
    // project.create is assigned, so it must not appear as available — that is
    // what keeps the 409 path unreachable through normal use (FR-RP4).
    await waitFor(() =>
      expect(within(available).getByText('project.view')).toBeInTheDocument(),
    );
    expect(
      within(available).queryByText('project.create'),
    ).not.toBeInTheDocument();
  });

  it('assigns a permission', async () => {
    let assigned: unknown = null;
    setup();
    server.use(
      http.post(`${BASE}/role/1/permission`, async ({ request }) => {
        assigned = await request.json();
        return HttpResponse.json({ roleId: 1, assigned: [2] }, { status: 201 });
      }),
    );
    const user = userEvent.setup();

    const available = await screen.findByRole('region', { name: 'Available' });
    await user.click(await within(available).findByText('project.view'));

    await waitFor(() => expect(assigned).toEqual({ permissionIds: [2] }));
  });

  it('searches the catalogue rather than offering a long unfiltered list', async () => {
    setup();
    const user = userEvent.setup();

    const search = await screen.findByLabelText('Search permissions');
    await user.type(search, 'delete');

    expect(search).toHaveValue('delete');
  });

  it('says so when everything active is already assigned', async () => {
    setup({
      assigned: [assignedPermission()],
      catalogue: [cataloguePermission(1, 'project.create')],
    });

    expect(
      await screen.findByText(/every active permission is already assigned/i),
    ).toBeInTheDocument();
  });
});

describe('RolePermissionsDialog — removing (FR-RP2, D-8)', () => {
  it('confirms, and the copy says it can be assigned again', async () => {
    setup();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', { name: 'Remove project.create' }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: /remove permission from role/i,
    });
    // D-8: the link is deactivated, not erased. The copy must not imply
    // destruction, and there is deliberately no separate reactivate control.
    expect(
      within(dialog).getByText(/you can assign it again later/i),
    ).toBeInTheDocument();
  });

  it('sends the removal when confirmed', async () => {
    let removed = '';
    setup();
    server.use(
      http.delete(`${BASE}/role/1/permission/:permissionId`, ({ params }) => {
        removed = String(params.permissionId);
        return HttpResponse.json({
          roleId: 1,
          permissionId: 1,
          linkStatus: 'INACTIVE',
        });
      }),
    );
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', { name: 'Remove project.create' }),
    );
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(removed).toBe('1'));
  });
});

describe('RolePermissionsDialog — gating (FR-UI6)', () => {
  it('hides assignment from a user who may only view', async () => {
    setup({ permissions: ['role-permission.view'] });

    expect(
      await screen.findByText(/do not have permission to assign/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Search permissions'),
    ).not.toBeInTheDocument();
  });

  it('hides removal without role-permission.remove', async () => {
    setup({ permissions: ['role-permission.view', 'role-permission.assign'] });

    await screen.findByText('project.create');
    expect(
      screen.queryByRole('button', { name: /remove project.create/i }),
    ).not.toBeInTheDocument();
  });
});

describe('RolePermissionsDialog — accessibility', () => {
  it('has no violations', async () => {
    const { baseElement } = setup();

    await screen.findByText('project.create');
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
