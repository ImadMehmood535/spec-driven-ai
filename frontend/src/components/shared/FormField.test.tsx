import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@test/render';
import { Input } from '@/components/ui/input';
import { FormField } from './FormField';

const field = (props: Partial<Parameters<typeof FormField>[0]> = {}) => (
  <FormField id="email" label="Email" {...props}>
    {(inputProps) => <Input {...inputProps} />}
  </FormField>
);

describe('FormField', () => {
  it('associates the label with its control', async () => {
    const user = userEvent.setup();
    renderWithProviders(field());

    await user.click(screen.getByLabelText('Email'));

    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
  });

  it('shows a description when there is no error', () => {
    renderWithProviders(field({ description: 'We never share this.' }));

    expect(screen.getByText('We never share this.')).toBeInTheDocument();
  });

  it('shows the error and marks the control invalid (FR-UI9)', () => {
    renderWithProviders(field({ error: 'Enter a valid email address.' }));

    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address.',
    );
  });

  it('links the error to the control, so it is announced (FR-UI11)', () => {
    renderWithProviders(field({ error: 'Enter a valid email address.' }));

    // Unattached red text is invisible to a screen reader — the point of
    // aria-describedby is that the error is read with the field.
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-describedby',
      'email-error',
    );
  });

  it('replaces the description with the error rather than showing both', () => {
    renderWithProviders(
      field({ description: 'We never share this.', error: 'Required.' }),
    );

    expect(screen.queryByText('We never share this.')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Required.');
  });

  it('marks a required field', () => {
    const { container } = renderWithProviders(field({ required: true }));

    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      '*',
    );
  });

  it('leaves aria-invalid false when valid', () => {
    renderWithProviders(field());

    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it.each(['light', 'dark'] as const)(
    'has no accessibility violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(field({ error: 'Required.' }), {
        theme,
      });

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
