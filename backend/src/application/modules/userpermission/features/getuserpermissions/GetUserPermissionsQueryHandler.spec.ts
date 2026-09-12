import { IUserPermissionQueries } from '@infrastructure/queries/abstraction/IUserPermissionQueries';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { GetUserPermissionsQuery } from './GetUserPermissionsQuery';
import { GetUserPermissionsQueryHandler } from './GetUserPermissionsQueryHandler';

describe('GetUserPermissionsQueryHandler', () => {
  let queries: jest.Mocked<IUserPermissionQueries>;
  let handler: GetUserPermissionsQueryHandler;

  beforeEach(() => {
    queries = {
      findEffectivePermissionNames: jest.fn().mockResolvedValue([]),
      userExists: jest.fn().mockResolvedValue(true),
    };
    handler = new GetUserPermissionsQueryHandler(queries);
  });

  it('returns the resolved permission names (FR-AC1)', async () => {
    queries.findEffectivePermissionNames.mockResolvedValue([
      'project.create',
      'project.view',
    ]);

    const response = await handler.execute(new GetUserPermissionsQuery(1));

    expect(response).toEqual({
      userId: 1,
      permissions: ['project.create', 'project.view'],
    });
  });

  it('404s for a user that does not exist', async () => {
    queries.userExists.mockResolvedValue(false);

    await expect(
      handler.execute(new GetUserPermissionsQuery(99)),
    ).rejects.toThrow(NotFoundError);
  });

  it('does not resolve permissions for a non-existent user', async () => {
    queries.userExists.mockResolvedValue(false);

    await expect(
      handler.execute(new GetUserPermissionsQuery(99)),
    ).rejects.toThrow(NotFoundError);
    expect(queries.findEffectivePermissionNames).not.toHaveBeenCalled();
  });

  it('returns an empty set — not a 404 — for an existing user with none', async () => {
    // An inactive user, a user with no role, or a role granting nothing all
    // land here. That is a legitimate deny, distinct from "no such user".
    const response = await handler.execute(new GetUserPermissionsQuery(1));

    expect(response.permissions).toEqual([]);
  });
});
