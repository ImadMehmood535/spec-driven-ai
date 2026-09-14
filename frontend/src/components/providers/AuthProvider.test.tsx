import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@test/render';
import { server } from '@test/msw/server';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { clearToken, readToken, storeToken } from '@/lib/token';

const BASE = 'http://localhost:3000';

const token = (payload: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const future = Math.floor(Date.now() / 1000) + 3600;
const past = Math.floor(Date.now() / 1000) - 3600;

const validToken = token({
  sub: 'uid-1',
  username: 'ahmed',
  role: 'Developer Admin',
  permissions: ['user.view', 'role.view'],
  exp: future,
});

function Probe() {
  const { claims, ready, signIn, signOut } = useAuth();
  const { permissions } = usePermissions();

  return (
    <div>
      <span data-testid="ready">{String(ready)}</span>
      <span data-testid="username">{claims?.username ?? 'none'}</span>
      <span data-testid="permissions">{permissions.join(',')}</span>
      <button onClick={() => signIn(validToken)}>Sign in</button>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}

const renderAuth = (router?: Record<string, unknown>) =>
  renderWithProviders(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
    { router },
  );

afterEach(() => clearToken());

describe('AuthProvider — restoring a session', () => {
  it('restores a valid stored token on load', async () => {
    storeToken(validToken);
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('ahmed'),
    );
  });

  it('discards an expired token instead of spending a guaranteed 401', async () => {
    storeToken(
      token({ sub: 'uid-1', username: 'ahmed', permissions: [], exp: past }),
    );
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('ready')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(readToken()).toBeNull();
  });

  it('tolerates a malformed stored token', async () => {
    storeToken('not-a-token');
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('ready')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  it('reports ready even when there is no session, so guards do not hang', async () => {
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('ready')).toHaveTextContent('true'),
    );
  });
});

describe('AuthProvider — claims feed the permission gate (FR-UI6)', () => {
  it('supplies the token permissions', async () => {
    storeToken(validToken);
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('permissions')).toHaveTextContent(
        'user.view,role.view',
      ),
    );
  });

  it('supplies none when signed out', async () => {
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId('ready')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('permissions')).toHaveTextContent('');
  });
});

describe('AuthProvider — sign in and out', () => {
  it('stores the token on sign in', async () => {
    const user = userEvent.setup();
    renderAuth();
    await waitFor(() =>
      expect(screen.getByTestId('ready')).toHaveTextContent('true'),
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(readToken()).toBe(validToken);
    expect(screen.getByTestId('username')).toHaveTextContent('ahmed');
  });

  it('clears the token on sign out', async () => {
    storeToken(validToken);
    const user = userEvent.setup();
    renderAuth();
    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('ahmed'),
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(readToken()).toBeNull();
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  it('clears the query cache on sign out, so the next user sees nothing stale', async () => {
    storeToken(validToken);
    const user = userEvent.setup();
    const { queryClient } = renderAuth();
    queryClient.setQueryData(['users'], [{ id: 1, name: 'Ahmed' }]);

    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('ahmed'),
    );
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(queryClient.getQueryData(['users'])).toBeUndefined();
  });
});

describe('AuthProvider — reacting to the API', () => {
  it('attaches the token to requests through the api-client seam', async () => {
    storeToken(validToken);
    let seen: string | null = null;
    server.use(
      http.get(`${BASE}/user`, ({ request }) => {
        seen = request.headers.get('authorization');
        return HttpResponse.json({ items: [] });
      }),
    );
    renderAuth();
    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('ahmed'),
    );

    await apiRequest('/user');

    expect(seen).toBe(`Bearer ${validToken}`);
  });

  it('clears the session and redirects on 401', async () => {
    storeToken(validToken);
    const replace = vi.fn();
    server.use(
      http.get(`${BASE}/user`, () =>
        HttpResponse.json(
          { statusCode: 401, message: 'x', error: 'UnauthorizedError' },
          { status: 401 },
        ),
      ),
    );
    renderAuth({ replace });
    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('ahmed'),
    );

    await apiRequest('/user').catch(() => undefined);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(readToken()).toBeNull();
  });

  it('does NOT sign the user out on 403 — they are signed in, just not permitted', async () => {
    storeToken(validToken);
    const replace = vi.fn();
    server.use(
      http.get(`${BASE}/user`, () =>
        HttpResponse.json(
          { statusCode: 403, message: 'x', error: 'ForbiddenError' },
          { status: 403 },
        ),
      ),
    );
    renderAuth({ replace });
    await waitFor(() =>
      expect(screen.getByTestId('username')).toHaveTextContent('ahmed'),
    );

    await apiRequest('/user').catch(() => undefined);

    expect(replace).not.toHaveBeenCalled();
    expect(readToken()).toBe(validToken);
  });
});
