import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@test/render';
import { ConfirmDialog } from './ConfirmDialog';

const dialog = (props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => (
  <ConfirmDialog
    open
    onOpenChange={() => undefined}
    title="Deactivate user?"
    description="Ahmed Khan will no longer be able to sign in."
    confirmLabel="Deactivate"
    onConfirm={() => undefined}
    {...props}
  />
);

describe('ConfirmDialog (FR-UI7)', () => {
  it('states what will actually happen, not just "are you sure"', () => {
    renderWithProviders(dialog());

    expect(
      screen.getByText('Ahmed Khan will no longer be able to sign in.'),
    ).toBeInTheDocument();
  });

  it('labels the confirm button with the action', () => {
    renderWithProviders(dialog());

    // "OK" tells the user nothing about what they are agreeing to.
    expect(
      screen.getByRole('button', { name: 'Deactivate' }),
    ).toBeInTheDocument();
  });

  it('confirms when the action is taken', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(dialog({ onConfirm }));

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on cancel without confirming', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(dialog({ onConfirm, onOpenChange }));

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(dialog({ onOpenChange }));

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables both buttons while the mutation is pending (FR-UI7)', () => {
    renderWithProviders(dialog({ pending: true }));

    // No double submission.
    expect(screen.getByRole('button', { name: /working/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('traps focus inside the dialog (FR-UI11)', async () => {
    renderWithProviders(dialog());

    // Radix moves focus into the dialog on open; the content is a modal.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it('renders nothing when closed', () => {
    renderWithProviders(dialog({ open: false }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { baseElement } = renderWithProviders(
        dialog({ destructive: true }),
        { theme },
      );

      expect(await axe(baseElement)).toHaveNoViolations();
    },
  );
});
