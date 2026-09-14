import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@test/render';
import { ApiError } from '@/lib/api-error';
import { UserForm } from './UserForm';
import type { User } from './types';

const PASSWORD = 'a-real-password';

const existing: User = {
  id: 1,
  globalUId: 'uid-1',
  email: 'ahmed@example.com',
  username: 'ahmed',
  firstName: 'Ahmed',
  lastName: 'Khan',
  roleId: 1,
  roleName: 'Developer Admin',
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
};

const form = (props: Partial<Parameters<typeof UserForm>[0]> = {}) => (
  <UserForm onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />
);

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/first name/i), 'Ahmed');
  await user.type(screen.getByLabelText(/last name/i), 'Khan');
  await user.type(screen.getByLabelText(/email/i), 'ahmed@example.com');
  await user.type(screen.getByLabelText(/username/i), 'ahmed');
};

describe('UserForm — credentials (D-9, NFR-3)', () => {
  it('asks for a password when creating', () => {
    renderWithProviders(form());

    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it('does NOT ask for one when editing', () => {
    // A credential must not arrive in a general-purpose body; changing one is
    // its own dialog.
    renderWithProviders(form({ user: existing }));

    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument();
  });

  it('masks the password field', () => {
    renderWithProviders(form());

    expect(screen.getByLabelText(/^password/i)).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('requires at least 8 characters', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ onSubmit }));

    await fill(user);
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('never renders the password value anywhere readable', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithProviders(form({ onSubmit }));

    await fill(user);
    await user.type(screen.getByLabelText(/^password/i), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    // It is submitted, but must not appear as text anywhere in the DOM.
    expect(onSubmit).toHaveBeenCalled();
    expect(container.textContent).not.toContain(PASSWORD);
  });

  it('omits the password entirely from an edit submission', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ user: existing, onSubmit }));

    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Ahmad');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: expect.anything() }),
    );
  });
});

describe('UserForm — two unique fields (FR-UI9)', () => {
  it('puts a duplicate EMAIL on the email field', () => {
    renderWithProviders(
      form({
        error: new ApiError(
          'conflict',
          409,
          'A user with that email already exists.',
          'email',
        ),
      }),
    );

    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(/username/i)).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it('puts a duplicate USERNAME on the username field', () => {
    // Unlike roles and permissions, this form cannot blanket-attribute a 409 —
    // it has two unique fields, and the API names which one.
    renderWithProviders(
      form({
        error: new ApiError(
          'conflict',
          409,
          'A user with that username already exists.',
          'username',
        ),
      }),
    );

    expect(screen.getByLabelText(/username/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it('preserves input when the server rejects it', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(form());

    await user.type(screen.getByLabelText(/username/i), 'ahmed');
    rerender(
      form({
        error: new ApiError(
          'conflict',
          409,
          'A user with that username already exists.',
          'username',
        ),
      }),
    );

    expect(screen.getByLabelText(/username/i)).toHaveValue('ahmed');
  });
});

describe('UserForm — validation and state', () => {
  it.each([
    [/first name/i, 'Enter a first name.'],
    [/last name/i, 'Enter a last name.'],
    [/username/i, 'Enter a username.'],
  ])('requires %s', async (_label, message) => {
    const user = userEvent.setup();
    renderWithProviders(form());

    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('rejects an address with no @', async () => {
    const user = userEvent.setup();
    renderWithProviders(form());

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(
      screen.getByText('Enter a valid email address.'),
    ).toBeInTheDocument();
  });

  it('trims before submitting', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ onSubmit }));

    await user.type(screen.getByLabelText(/first name/i), '  Ahmed  ');
    await user.type(screen.getByLabelText(/last name/i), 'Khan');
    await user.type(screen.getByLabelText(/email/i), ' ahmed@example.com ');
    await user.type(screen.getByLabelText(/username/i), ' ahmed ');
    await user.type(screen.getByLabelText(/^password/i), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ahmed',
        email: 'ahmed@example.com',
        username: 'ahmed',
      }),
    );
  });

  it('disables everything while saving', () => {
    renderWithProviders(form({ pending: true }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(form(), { theme });

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
