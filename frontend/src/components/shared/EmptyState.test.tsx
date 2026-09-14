import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@test/render';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('says what is absent and how to fill it (FR-UI7)', () => {
    renderWithProviders(
      <EmptyState
        title="No roles yet"
        description="Create a role to start granting permissions."
      />,
    );

    expect(screen.getByText('No roles yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create a role to start granting permissions.'),
    ).toBeInTheDocument();
  });

  it('offers the action that fills it', () => {
    renderWithProviders(
      <EmptyState
        title="No roles yet"
        description="Create one to begin."
        action={<Button>Create role</Button>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Create role' }),
    ).toBeInTheDocument();
  });

  it('renders without an action', () => {
    renderWithProviders(<EmptyState title="Nothing" description="Nothing." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <EmptyState title="No roles yet" description="Create one to begin." />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
