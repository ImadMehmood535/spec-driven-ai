'use client';

import * as React from 'react';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-error';
import type { Role } from './types';

export interface RoleFormValues {
  name: string;
  description: string | null;
}

export interface RoleFormProps {
  /** Present in edit mode; absent when creating. One form, two modes. */
  role?: Role;
  pending?: boolean;
  error?: unknown;
  onSubmit: (values: RoleFormValues) => void;
  onCancel: () => void;
}

/**
 * One form for create and edit (FR-UI13). Two forms differing only in their
 * submit handler is exactly the duplication this project forbids.
 */
export function RoleForm({
  role,
  pending = false,
  error,
  onSubmit,
  onCancel,
}: RoleFormProps) {
  const [name, setName] = React.useState(role?.name ?? '');
  const [description, setDescription] = React.useState(role?.description ?? '');
  const [touched, setTouched] = React.useState(false);

  const apiError = error instanceof ApiError ? error : undefined;

  /**
   * A conflict on this form can only be about the name — it is the only unique
   * field. The API's message is of the form `Role "x" already exists.`,
   * which never contains the word "name", so the generic inference in
   * api-error.ts cannot attribute it. The form knows its own domain, so it
   * attributes it here rather than showing it detached from the input.
   */
  const serverFieldError =
    apiError && (apiError.kind === 'conflict' || apiError.field === 'name')
      ? apiError.message
      : undefined;
  const serverGeneralError =
    apiError && !serverFieldError ? apiError.message : undefined;

  const localNameError = !touched
    ? undefined
    : name.trim().length === 0
      ? 'Enter a role name.'
      : undefined;

  const nameError = localNameError ?? serverFieldError;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);

    if (name.trim().length === 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim().length > 0 ? description.trim() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <FormField
        id="role-name"
        label="Name"
        description="A human-readable name, such as Developer Admin."
        error={nameError}
        required
      >
        {(props) => (
          <Input
            {...props}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
          />
        )}
      </FormField>

      <FormField
        id="role-description"
        label="Description"
        description="Optional. Shown to administrators."
      >
        {(props) => (
          <Input
            {...props}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={pending}
          />
        )}
      </FormField>

      {serverGeneralError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverGeneralError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : role ? 'Save changes' : 'Create role'}
        </Button>
      </div>
    </form>
  );
}
