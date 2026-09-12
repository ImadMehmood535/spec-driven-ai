import {
  IRolePermissionQueries,
  RolePermissionReadModel,
} from '@infrastructure/queries/abstraction/IRolePermissionQueries';
import { IRoleQueries } from '@infrastructure/queries/abstraction/IRoleQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetRolePermissionsQuery } from './GetRolePermissionsQuery';
import { GetRolePermissionsQueryHandler } from './GetRolePermissionsQueryHandler';

const link: RolePermissionReadModel = {
  linkId: 4,
  permissionId: 2,
  name: 'project.create',
  description: 'Create a project',
  permissionStatus: 'ACTIVE',
  linkStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
};

describe('GetRolePermissionsQueryHandler', () => {
  let linkQueries: jest.Mocked<IRolePermissionQueries>;
  let roleQueries: jest.Mocked<IRoleQueries>;
  let handler: GetRolePermissionsQueryHandler;

  beforeEach(() => {
    linkQueries = { findByRole: jest.fn().mockResolvedValue([link]) };
    roleQueries = {
      findList: jest.fn(),
      findById: jest.fn().mockResolvedValue({ id: 1, name: 'Developer Admin' }),
    };
    handler = new GetRolePermissionsQueryHandler(linkQueries, roleQueries);
  });

  it('returns permission detail, not bare ids (FR-RP3)', async () => {
    const response = await handler.execute(new GetRolePermissionsQuery(1));

    expect(response.items[0]).toEqual(
      expect.objectContaining({
        permissionId: 2,
        name: 'project.create',
        description: 'Create a project',
      }),
    );
  });

  it('excludes removed links by default (D-8)', async () => {
    await handler.execute(new GetRolePermissionsQuery(1));

    expect(linkQueries.findByRole).toHaveBeenCalledWith(1, false);
  });

  it('can include removed links when asked', async () => {
    await handler.execute(new GetRolePermissionsQuery(1, true));

    expect(linkQueries.findByRole).toHaveBeenCalledWith(1, true);
  });

  it('404s for a missing role rather than returning an empty list', async () => {
    roleQueries.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetRolePermissionsQuery(99)),
    ).rejects.toThrow(NotFoundError);
  });

  it('returns an empty list for a role with no permissions', async () => {
    linkQueries.findByRole.mockResolvedValue([]);

    const response = await handler.execute(new GetRolePermissionsQuery(1));

    expect(response).toEqual({ roleId: 1, items: [] });
  });
});
