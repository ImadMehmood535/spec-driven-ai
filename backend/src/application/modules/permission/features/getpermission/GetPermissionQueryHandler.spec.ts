import {
  IPermissionQueries,
  PermissionReadModel,
} from '@infrastructure/queries/abstraction/IPermissionQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetPermissionQuery } from './GetPermissionQuery';
import { GetPermissionQueryHandler } from './GetPermissionQueryHandler';

const row: PermissionReadModel = {
  id: 1,
  globalUId: 'a3f1c2e4-5b6d-4e7f-8a9b-0c1d2e3f4a5b',
  name: 'project.create',
  description: null,
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
};

describe('GetPermissionQueryHandler', () => {
  let queries: jest.Mocked<IPermissionQueries>;
  let handler: GetPermissionQueryHandler;

  beforeEach(() => {
    queries = { findList: jest.fn(), findById: jest.fn() };
    handler = new GetPermissionQueryHandler(queries);
  });

  it('returns the read model', async () => {
    queries.findById.mockResolvedValue(row);

    await expect(handler.execute(new GetPermissionQuery(1))).resolves.toEqual(
      row,
    );
  });

  it('throws NotFoundError when absent', async () => {
    queries.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetPermissionQuery(99))).rejects.toThrow(
      NotFoundError,
    );
  });
});
