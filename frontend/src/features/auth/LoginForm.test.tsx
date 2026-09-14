import { http, HttpResponse } from 'msw';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@test/render';
import { server } from '@test/msw/server';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LoginForm } from '@/features/auth/LoginForm';
import { clearToken, readToken } from '@/lib/token';

const BASE = 'http://localhost:3000';
const PASSWORD = 'a-real-password';

const token = (payload: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const validToken = token({
  sub: 'uid-1',
  username: 'ahmed',
  role: 'Developer Admin',
  permissions: ['user.view'],
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const renderForm = (router?: { replace?: ReturnType<typeof vi.fn> }) =>
  renderWithProviders(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>,
    { router },
  );

afterEach(() => clearToken());

describe('LoginForm (FR-UI5)', () => {
  it('signs in and redirects on success', async () => {
    const replace = vi.fn();
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ accessToken: validToken, expiresIn: '1h' }),
      ),
    );
    const user = userEvent.setup();
    renderForm({ replace });

    await user.type(screen.getByLabelText(/email or username/i), 'ahmed');
    await user.type(screen.getByLabelText(/password/i), PASSWORD);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(readToken()).toBe(validToken);
  });

  it("shows the API's uniform failure message verbatim", async () => {
    // The API returns one message for unknown user, wrong password and
    // deactivated account. Elaborating here would recreate the enumeration
    // oracle it deliberately avoids.
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(
          {
            statusCode: 401,
            message: 'Invalid credentials.',
            error: 'UnauthorizedError',
          },
          { status: 401 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email or username/i), 'ahmed');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials.',
    );
  });

  it('stores no token when sign-in fails', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(
          {
            statusCode: 401,
            message: 'Invalid credentials.',
            error: 'UnauthorizedError',
          },
          { status: 401 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email or username/i), 'ahmed');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByRole('alert');
    expect(readToken()).toBeNull();
  });

  it('validates before sending anything (FR-UI9)', async () => {
    const requests: string[] = [];
    server.use(
      http.post(`${BASE}/auth/login`, () => {
        requests.push('sent');
        return HttpResponse.json({ accessToken: validToken, expiresIn: '1h' });
      }),
    );
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText('Enter your email or username.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('disables the form while pending, preventing double submission (FR-UI7)', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ accessToken: validToken, expiresIn: '1h' });
      }),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email or username/i), 'ahmed');
    await user.type(screen.getByLabelText(/password/i), PASSWORD);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByRole('button', { name: /signing in/i }),
    ).toBeDisabled();
  });

  it('preserves what the user typed after a failure (FR-UI9)', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json(
          {
            statusCode: 401,
            message: 'Invalid credentials.',
            error: 'UnauthorizedError',
          },
          { status: 401 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email or username/i), 'ahmed');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByRole('alert');
    expect(screen.getByLabelText(/email or username/i)).toHaveValue('ahmed');
  });

  it('masks the password field', () => {
    renderForm();

    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('never puts the password in the URL', async () => {
    let requestUrl = '';
    server.use(
      http.post(`${BASE}/auth/login`, ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({ accessToken: validToken, expiresIn: '1h' });
      }),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email or username/i), 'ahmed');
    await user.type(screen.getByLabelText(/password/i), PASSWORD);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(requestUrl).toContain('/auth/login'));
    expect(requestUrl).not.toContain(PASSWORD);
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>,
        { theme },
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
