import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@test/render';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('states what failed (FR-UI7)', () => {
    renderWithProviders(<ErrorState message="Could not load roles." />);

    expect(screen.getByText('Could not load roles.')).toBeInTheDocument();
  });

  it('announces itself to assistive technology', () => {
    renderWithProviders(<ErrorState message="Could not load roles." />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('offers a retry when one is possible', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ErrorState message="Could not load roles." onRetry={onRetry} />,
    );

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits retry when there is nothing to retry', () => {
    renderWithProviders(<ErrorState message="Could not load roles." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is reachable by keyboard (FR-UI11)', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ErrorState message="Could not load roles." onRetry={onRetry} />,
    );

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(
        <ErrorState
          message="Could not load roles."
          onRetry={() => undefined}
        />,
        { theme },
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
