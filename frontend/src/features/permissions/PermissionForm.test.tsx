import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@test/render';
import { ApiError } from '@/lib/api-error';
import { PermissionForm } from './PermissionForm';
import type { Permission } from './types';

const existing: Permission = {
  id: 1,
  globalUId: 'uid-1',
  name: 'project.create',
  description: 'Create a project',
  entityStatus: 'ACTIVE',
  createdAt: '2026-09-12T00:00:00.000Z',
  modifiedOn: null,
};

const form = (props: Partial<Parameters<typeof PermissionForm>[0]> = {}) => (
  <PermissionForm onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />
);

describe('PermissionForm — one form, two modes (FR-UI13)', () => {
  it('creates when given no permission', () => {
    renderWithProviders(form());

    expect(
      screen.getByRole('button', { name: 'Create permission' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
  });

  it('edits when given one, pre-filled', () => {
    renderWithProviders(form({ permission: existing }));

    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('project.create');
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'Create a project',
    );
  });
});

describe('PermissionForm — validation (FR-UI9)', () => {
  it('requires a name', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ onSubmit }));

    await user.click(screen.getByRole('button', { name: 'Create permission' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a permission name.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires the resource.action shape §5 uses', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ onSubmit }));

    await user.type(screen.getByLabelText(/name/i), 'notavalidname');
    await user.click(screen.getByRole('button', { name: 'Create permission' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /resource\.action form/i,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('says how to fix it, not just that it is wrong', () => {
    renderWithProviders(form());

    expect(screen.getByText(/such as project\.create/i)).toBeInTheDocument();
  });

  it('submits a valid permission, trimmed', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ onSubmit }));

    await user.type(screen.getByLabelText(/name/i), '  project.view  ');
    await user.click(screen.getByRole('button', { name: 'Create permission' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'project.view',
      description: null,
    });
  });

  it('sends null rather than an empty description', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ onSubmit }));

    await user.type(screen.getByLabelText(/name/i), 'project.view');
    await user.type(screen.getByLabelText(/description/i), '   ');
    await user.click(screen.getByRole('button', { name: 'Create permission' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'project.view',
      description: null,
    });
  });
});

describe('PermissionForm — server errors (FR-UI9)', () => {
  it('shows a duplicate-name conflict on the name field', () => {
    renderWithProviders(
      form({
        error: new ApiError(
          'conflict',
          409,
          'Permission "project.create" already exists.',
          'name',
        ),
      }),
    );

    expect(screen.getByLabelText(/name/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('already exists');
  });

  it('preserves what the user typed when the server rejects it', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(form());

    await user.type(screen.getByLabelText(/name/i), 'project.create');
    rerender(
      form({
        error: new ApiError('conflict', 409, 'Already exists.', 'name'),
      }),
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('project.create');
  });

  it('shows an unattributed error separately from the fields', () => {
    renderWithProviders(
      form({ error: new ApiError('server', 500, 'Something went wrong.') }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong.',
    );
    expect(screen.getByLabelText(/name/i)).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });
});

describe('PermissionForm — pending and accessibility', () => {
  it('disables everything while saving, preventing double submission', () => {
    renderWithProviders(form({ pending: true }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
  });

  it('cancels without submitting', async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(form({ onCancel, onSubmit }));

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        form({
          error: new ApiError('conflict', 409, 'Already exists.', 'name'),
        }),
        { theme },
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
