import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@test/render';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('reads "Active" for an active record', () => {
    renderWithProviders(<StatusBadge status="ACTIVE" />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('reads "Inactive" for a deactivated record', () => {
    renderWithProviders(<StatusBadge status="INACTIVE" />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('never relies on colour alone — the word is always present', () => {
    // Colour-only status is unreadable for colour-blind users and in
    // high-contrast modes, which the standards forbid.
    const { container } = renderWithProviders(
      <StatusBadge status="INACTIVE" />,
    );

    expect(container.textContent?.trim()).not.toBe('');
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        <StatusBadge status="ACTIVE" />,
        { theme },
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
