import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@test/render';
import { PermissionsProvider } from '@/hooks/usePermissions';
import { PermissionGate } from './PermissionGate';

const withPermissions = (permissions: string[], ui: React.ReactElement) =>
  renderWithProviders(
    <PermissionsProvider permissions={permissions}>{ui}</PermissionsProvider>,
  );

describe('PermissionGate (FR-UI6)', () => {
  it('renders the control when the permission is held', () => {
    withPermissions(
      ['user.create'],
      <PermissionGate permission="user.create">
        <button>Create user</button>
      </PermissionGate>,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('hides the control when it is not', () => {
    withPermissions(
      ['user.view'],
      <PermissionGate permission="user.create">
        <button>Create user</button>
      </PermissionGate>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hides everything when no permissions are known', () => {
    // Before sign-in the claims are empty. Defaulting to hidden avoids
    // flashing controls the user may not have.
    withPermissions(
      [],
      <PermissionGate permission="user.create">
        <button>Create user</button>
      </PermissionGate>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('can show a fallback instead', () => {
    withPermissions(
      [],
      <PermissionGate
        permission="user.create"
        fallback={<p>You cannot create users.</p>}
      >
        <button>Create user</button>
      </PermissionGate>,
    );

    expect(screen.getByText('You cannot create users.')).toBeInTheDocument();
  });

  it('matches the permission exactly, never by prefix', () => {
    withPermissions(
      ['user'],
      <PermissionGate permission="user.create">
        <button>Create user</button>
      </PermissionGate>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
