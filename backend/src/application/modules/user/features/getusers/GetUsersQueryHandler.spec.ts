import {
  IUserQueries,
  UserReadModel,
} from '@infrastructure/queries/abstraction/IUserQueries';
import { GetUsersQuery } from './GetUsersQuery';
import { GetUsersQueryHandler } from './GetUsersQueryHandler';

const row: UserReadModel = {
  id: 1,
  globalUId: 'uid-1',
  email: 'ahmed@example.com',
  username: 'ahmed',
  firstName: 'Ahmed',
  lastName: 'Khan',
  roleId: 2,
  roleName: 'Developer Admin',
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
};

describe('GetUsersQueryHandler', () => {
  let queries: jest.Mocked<IUserQueries>;
  let handler: GetUsersQueryHandler;

  beforeEach(() => {
    queries = { findList: jest.fn(), findById: jest.fn() };
    handler = new GetUsersQueryHandler(queries);
  });

  it('passes the filter through', async () => {
    queries.findList.mockResolvedValue({ rows: [], total: 0 });
    const filter = { search: 'ahmed', roleId: 2, page: 1, size: 10 };

    await handler.execute(new GetUsersQuery(filter));

    expect(queries.findList).toHaveBeenCalledWith(filter);
  });

  it('builds pagination meta', async () => {
    queries.findList.mockResolvedValue({ rows: [row], total: 21 });

    const response = await handler.execute(
      new GetUsersQuery({ page: 1, size: 10 }),
    );

    expect(response.meta.totalPages).toBe(3);
    expect(response.items).toHaveLength(1);
  });

  it('includes the role name so the UI need not resolve it', async () => {
    queries.findList.mockResolvedValue({ rows: [row], total: 1 });

    const response = await handler.execute(
      new GetUsersQuery({ page: 1, size: 50 }),
    );

    expect(response.items[0].roleName).toBe('Developer Admin');
  });

  it('exposes no password field in any listed item (NFR-3)', async () => {
    queries.findList.mockResolvedValue({ rows: [row], total: 1 });

    const response = await handler.execute(
      new GetUsersQuery({ page: 1, size: 50 }),
    );

    const keys = Object.keys(response.items[0]);
    expect(keys).not.toContain('passwordHash');
    expect(keys).not.toContain('password');
  });

  it('reports a user with no role as null rather than omitting it', async () => {
    queries.findList.mockResolvedValue({
      rows: [{ ...row, roleId: null, roleName: null }],
      total: 1,
    });

    const response = await handler.execute(
      new GetUsersQuery({ page: 1, size: 50 }),
    );

    expect(response.items[0].roleId).toBeNull();
    expect(response.items[0].roleName).toBeNull();
  });
});
