import {
  IRoleQueries,
  RoleReadModel,
} from '@infrastructure/queries/abstraction/IRoleQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetRoleQuery } from './GetRoleQuery';
import { GetRoleQueryHandler } from './GetRoleQueryHandler';

const row: RoleReadModel = {
  id: 1,
  globalUId: 'a3f1c2e4-5b6d-4e7f-8a9b-0c1d2e3f4a5b',
  name: 'Developer Admin',
  description: null,
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
};

describe('GetRoleQueryHandler', () => {
  let queries: jest.Mocked<IRoleQueries>;
  let handler: GetRoleQueryHandler;

  beforeEach(() => {
    queries = { findList: jest.fn(), findById: jest.fn() };
    handler = new GetRoleQueryHandler(queries);
  });

  it('returns the read model', async () => {
    queries.findById.mockResolvedValue(row);

    await expect(handler.execute(new GetRoleQuery(1))).resolves.toEqual(row);
  });

  it('throws NotFoundError when absent', async () => {
    queries.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetRoleQuery(99))).rejects.toThrow(
      NotFoundError,
    );
  });
});
