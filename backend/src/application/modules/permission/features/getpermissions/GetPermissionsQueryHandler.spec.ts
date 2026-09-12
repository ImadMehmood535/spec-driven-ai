import {
  IPermissionQueries,
  PermissionReadModel,
} from '@infrastructure/queries/abstraction/IPermissionQueries';
import { GetPermissionsQuery } from './GetPermissionsQuery';
import { GetPermissionsQueryHandler } from './GetPermissionsQueryHandler';

const row = (id: number): PermissionReadModel => ({
  id,
  globalUId: `uid-${id}`,
  name: `project.action${id}`,
  description: null,
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
});

describe('GetPermissionsQueryHandler', () => {
  let queries: jest.Mocked<IPermissionQueries>;
  let handler: GetPermissionsQueryHandler;

  beforeEach(() => {
    queries = { findList: jest.fn(), findById: jest.fn() };
    handler = new GetPermissionsQueryHandler(queries);
  });

  it('passes the filter through untouched', async () => {
    queries.findList.mockResolvedValue({ rows: [], total: 0 });
    const filter = {
      search: 'project',
      entityStatus: 'ACTIVE',
      page: 2,
      size: 10,
    };

    await handler.execute(new GetPermissionsQuery(filter));

    expect(queries.findList).toHaveBeenCalledWith(filter);
  });

  it('builds pagination meta from the total', async () => {
    queries.findList.mockResolvedValue({ rows: [row(1), row(2)], total: 25 });

    const response = await handler.execute(
      new GetPermissionsQuery({ page: 1, size: 10 }),
    );

    expect(response.items).toHaveLength(2);
    expect(response.meta).toEqual({
      currentPage: 1,
      pageSize: 10,
      totalItems: 25,
      totalPages: 3,
    });
  });

  it('returns an empty page without failing', async () => {
    queries.findList.mockResolvedValue({ rows: [], total: 0 });

    const response = await handler.execute(
      new GetPermissionsQuery({ page: 1, size: 50 }),
    );

    expect(response.items).toEqual([]);
    expect(response.meta.totalPages).toBe(0);
  });
});
