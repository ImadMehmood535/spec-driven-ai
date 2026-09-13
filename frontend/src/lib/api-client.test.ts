import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@test/msw/server';
import {
  apiRequest,
  setTokenGetter,
  setUnauthenticatedHandler,
} from './api-client';
import { ApiError } from './api-error';

const BASE = 'http://localhost:3000';

afterEach(() => {
  setTokenGetter(() => null);
  setUnauthenticatedHandler(() => undefined);
});

describe('apiRequest', () => {
  it('returns the parsed body on success', async () => {
    server.use(
      http.get(`${BASE}/permission`, () => HttpResponse.json({ items: [1] })),
    );

    await expect(apiRequest('/permission')).resolves.toEqual({ items: [1] });
  });

  it('attaches the bearer token from the single seam', async () => {
    let seen: string | null = null;
    setTokenGetter(() => 'a.test.token');
    server.use(
      http.get(`${BASE}/permission`, ({ request }) => {
        seen = request.headers.get('authorization');
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/permission');

    expect(seen).toBe('Bearer a.test.token');
  });

  it('sends no Authorization header when there is no token', async () => {
    let seen: string | null = 'unset';
    server.use(
      http.get(`${BASE}/permission`, ({ request }) => {
        seen = request.headers.get('authorization');
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/permission');

    expect(seen).toBeNull();
  });

  it('skips auth where a token cannot exist yet, such as login', async () => {
    let seen: string | null = 'unset';
    setTokenGetter(() => 'a.test.token');
    server.use(
      http.post(`${BASE}/auth/login`, ({ request }) => {
        seen = request.headers.get('authorization');
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/auth/login', {
      method: 'POST',
      body: {},
      skipAuth: true,
    });

    expect(seen).toBeNull();
  });

  it('builds a query string, omitting undefined and empty values', async () => {
    let url = '';
    server.use(
      http.get(`${BASE}/user`, ({ request }) => {
        url = request.url;
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/user', {
      query: { page: 1, search: '', entityStatus: undefined, size: 50 },
    });

    expect(url).toContain('page=1');
    expect(url).toContain('size=50');
    expect(url).not.toContain('search=');
    expect(url).not.toContain('entityStatus');
  });

  it('throws a normalised ApiError on failure', async () => {
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

    await expect(
      apiRequest('/permission', { method: 'POST', body: {} }),
    ).rejects.toMatchObject({
      kind: 'conflict',
      message: 'Permission "project.create" already exists.',
    });
  });

  it('clears the session on 401', async () => {
    const onUnauthenticated = vi.fn();
    setUnauthenticatedHandler(onUnauthenticated);
    server.use(
      http.get(`${BASE}/user`, () =>
        HttpResponse.json(
          { statusCode: 401, message: 'x', error: 'y' },
          { status: 401 },
        ),
      ),
    );

    await expect(apiRequest('/user')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('does NOT clear the session on 403 — signed in, just not permitted', async () => {
    const onUnauthenticated = vi.fn();
    setUnauthenticatedHandler(onUnauthenticated);
    server.use(
      http.get(`${BASE}/user`, () =>
        HttpResponse.json(
          { statusCode: 403, message: 'x', error: 'y' },
          { status: 403 },
        ),
      ),
    );

    await expect(apiRequest('/user')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it('reports a transport failure as a network error', async () => {
    server.use(http.get(`${BASE}/user`, () => HttpResponse.error()));

    await expect(apiRequest('/user')).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('survives an error response with no JSON body', async () => {
    server.use(
      http.get(
        `${BASE}/user`,
        () => new HttpResponse('not json', { status: 500 }),
      ),
    );

    await expect(apiRequest('/user')).rejects.toMatchObject({ kind: 'server' });
  });
});
