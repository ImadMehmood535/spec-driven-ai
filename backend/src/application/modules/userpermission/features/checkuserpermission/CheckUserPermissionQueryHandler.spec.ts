import { IUserPermissionQueries } from '@infrastructure/queries/abstraction/IUserPermissionQueries';
import { DomainError } from '@shared/errors/DomainError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { CheckUserPermissionQuery } from './CheckUserPermissionQuery';
import { CheckUserPermissionQueryHandler } from './CheckUserPermissionQueryHandler';

describe('CheckUserPermissionQueryHandler (FR-AC1)', () => {
  let queries: jest.Mocked<IUserPermissionQueries>;
  let handler: CheckUserPermissionQueryHandler;

  beforeEach(() => {
    queries = {
      findEffectivePermissionNames: jest
        .fn()
        .mockResolvedValue(['project.create', 'project.view']),
      userExists: jest.fn().mockResolvedValue(true),
    };
    handler = new CheckUserPermissionQueryHandler(queries);
  });

  it('allows an action the user holds', async () => {
    const response = await handler.execute(
      new CheckUserPermissionQuery(1, 'project.create'),
    );

    expect(response).toEqual({
      userId: 1,
      permission: 'project.create',
      allowed: true,
    });
  });

  it('denies an action the user does not hold', async () => {
    const response = await handler.execute(
      new CheckUserPermissionQuery(1, 'project.delete'),
    );

    expect(response.allowed).toBe(false);
  });

  it('denies when the user holds nothing', async () => {
    queries.findEffectivePermissionNames.mockResolvedValue([]);

    const response = await handler.execute(
      new CheckUserPermissionQuery(1, 'project.create'),
    );

    expect(response.allowed).toBe(false);
  });

  it('matches exactly — no prefix or partial match', async () => {
    const response = await handler.execute(
      new CheckUserPermissionQuery(1, 'project'),
    );

    expect(response.allowed).toBe(false);
  });

  it('is case-sensitive, since permission names are identifiers', async () => {
    const response = await handler.execute(
      new CheckUserPermissionQuery(1, 'PROJECT.CREATE'),
    );

    expect(response.allowed).toBe(false);
  });

  it('trims the requested name', async () => {
    const response = await handler.execute(
      new CheckUserPermissionQuery(1, '  project.create  '),
    );

    expect(response.allowed).toBe(true);
  });

  it.each(['', '   '])('rejects a blank name (%p)', async (name) => {
    await expect(
      handler.execute(new CheckUserPermissionQuery(1, name)),
    ).rejects.toThrow(DomainError);
  });

  it('404s for a user that does not exist', async () => {
    queries.userExists.mockResolvedValue(false);

    await expect(
      handler.execute(new CheckUserPermissionQuery(99, 'project.create')),
    ).rejects.toThrow(NotFoundError);
  });
});
