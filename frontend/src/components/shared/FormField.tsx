'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  id: string;
  label: string;
  /** Shown under the control; hidden once there is an error. */
  description?: string;
  error?: string;
  required?: boolean;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
}

/**
 * Pairs a label with its control and wires the error to it via
 * aria-describedby, so assistive technology announces the problem rather than
 * leaving it as unattached red text (FR-UI9, FR-UI11).
 */
export function FormField({
  id,
  label,
  description,
  error,
  required = false,
  children,
}: FormFieldProps) {
  const describedById = error
    ? `${id}-error`
    : description
      ? `${id}-description`
      : undefined;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedById,
      })}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : description ? (
        <p
          id={`${id}-description`}
          className={cn('text-sm text-muted-foreground')}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
