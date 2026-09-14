import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@test/render';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { RequireAuth } from '@/components/providers/RequireAuth';
import { clearToken, storeToken } from '@/lib/token';

const token = (payload: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const validToken = token({
  sub: 'uid-1',
  username: 'ahmed',
  permissions: [],
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const renderGuard = (replace = vi.fn()) => {
  const result = renderWithProviders(
    <AuthProvider>
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    </AuthProvider>,
    { router: { replace } },
  );
  return { ...result, replace };
};

afterEach(() => clearToken());

describe('RequireAuth', () => {
  it('renders the app for a signed-in user', async () => {
    storeToken(validToken);
    renderGuard();

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to login when there is no session', async () => {
    const { replace } = renderGuard();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });

  it('never shows protected content to a signed-out user', async () => {
    const { replace } = renderGuard();

    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects when the stored token has expired', async () => {
    storeToken(
      token({
        sub: 'uid-1',
        username: 'ahmed',
        permissions: [],
        exp: Math.floor(Date.now() / 1000) - 60,
      }),
    );
    const { replace } = renderGuard();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });
});

/**
 * The `ready: false` window is real in a browser — one frame before the
 * effect reads storage — but unobservable through the provider, because
 * localStorage is synchronous and RTL flushes effects within the same commit.
 * So the branch is tested directly rather than by chasing a timing window.
 */
describe('RequireAuth — before the session is known', () => {
  it('shows a skeleton rather than guessing', async () => {
    vi.doMock('@/components/providers/AuthProvider', () => ({
      useAuth: () => ({
        claims: null,
        ready: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      }),
    }));
    const { RequireAuth: Pending } =
      await import('@/components/providers/RequireAuth');

    renderWithProviders(
      <Pending>
        <p>Protected content</p>
      </Pending>,
    );

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    vi.doUnmock('@/components/providers/AuthProvider');
    vi.resetModules();
  });

  it('does not redirect until it knows', async () => {
    const replace = vi.fn();
    vi.doMock('@/components/providers/AuthProvider', () => ({
      useAuth: () => ({
        claims: null,
        ready: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      }),
    }));
    const { RequireAuth: Pending } =
      await import('@/components/providers/RequireAuth');

    renderWithProviders(
      <Pending>
        <p>Protected content</p>
      </Pending>,
      { router: { replace } },
    );

    // Redirecting before the token has been read would bounce a signed-in
    // user to login on every refresh.
    expect(replace).not.toHaveBeenCalled();
    vi.doUnmock('@/components/providers/AuthProvider');
    vi.resetModules();
  });
});
