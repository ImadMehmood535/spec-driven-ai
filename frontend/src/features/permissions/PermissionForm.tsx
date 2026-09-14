'use client';

import * as React from 'react';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-error';
import type { Permission } from './types';

export interface PermissionFormValues {
  name: string;
  description: string | null;
}

export interface PermissionFormProps {
  /** Present in edit mode; absent when creating. One form, two modes. */
  permission?: Permission;
  pending?: boolean;
  error?: unknown;
  onSubmit: (values: PermissionFormValues) => void;
  onCancel: () => void;
}

const NAME_PATTERN = /^[a-z-]+\.[a-z-]+$/;

/**
 * One form for create and edit (FR-UI13). Two forms differing only in their
 * submit handler is exactly the duplication this project forbids.
 */
export function PermissionForm({
  permission,
  pending = false,
  error,
  onSubmit,
  onCancel,
}: PermissionFormProps) {
  const [name, setName] = React.useState(permission?.name ?? '');
  const [description, setDescription] = React.useState(
    permission?.description ?? '',
  );
  const [touched, setTouched] = React.useState(false);

  const apiError = error instanceof ApiError ? error : undefined;

  /**
   * A conflict on this form can only be about the name — it is the only unique
   * field. The API's message is of the form `Permission "x" already exists.`,
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
      ? 'Enter a permission name.'
      : !NAME_PATTERN.test(name.trim())
        ? 'Use the resource.action form, for example project.create.'
        : undefined;

  const nameError = localNameError ?? serverFieldError;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);

    if (name.trim().length === 0 || !NAME_PATTERN.test(name.trim())) {
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
        id="permission-name"
        label="Name"
        description="The action this permission grants, such as project.create."
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
        id="permission-description"
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
          {pending
            ? 'Saving…'
            : permission
              ? 'Save changes'
              : 'Create permission'}
        </Button>
      </div>
    </form>
  );
}
