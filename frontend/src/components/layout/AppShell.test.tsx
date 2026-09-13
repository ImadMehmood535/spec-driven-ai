import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@test/render';
import { AppShell } from './AppShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/users',
}));

describe('AppShell', () => {
  it('renders its children', () => {
    renderWithProviders(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('links to every management section', () => {
    renderWithProviders(<AppShell>content</AppShell>);

    for (const label of ['Users', 'Roles', 'Permissions']) {
      expect(
        screen.getAllByRole('link', { name: new RegExp(label, 'i') }).length,
      ).toBeGreaterThan(0);
    }
  });

  it('marks the current section for assistive technology', () => {
    renderWithProviders(<AppShell>content</AppShell>);

    const current = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('aria-current') === 'page');

    expect(current).toHaveTextContent('Users');
  });

  it('collapses navigation behind a toggle on small screens (FR-UI10)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppShell>content</AppShell>);

    const toggle = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // Desktop nav plus the now-open mobile nav.
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(2);
  });

  it('offers a theme toggle with an accessible name (FR-UI12)', () => {
    renderWithProviders(<AppShell>content</AppShell>);

    expect(
      screen.getByRole('button', { name: /switch to (dark|light) theme/i }),
    ).toBeInTheDocument();
  });

  it('is operable by keyboard (FR-UI11)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppShell>content</AppShell>);

    await user.tab();

    expect(document.activeElement).not.toBe(document.body);
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(<AppShell>content</AppShell>, {
        theme,
      });

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
