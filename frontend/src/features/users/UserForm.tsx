'use client';

import * as React from 'react';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-error';
import type { User } from './types';

export interface UserFormValues {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  /** Present only when creating — an edit never carries a credential (D-9). */
  password?: string;
}

export interface UserFormProps {
  user?: User;
  pending?: boolean;
  error?: unknown;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

const PASSWORD_MIN_LENGTH = 8;

export function UserForm({
  user,
  pending = false,
  error,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const isEditing = Boolean(user);

  const [email, setEmail] = React.useState(user?.email ?? '');
  const [username, setUsername] = React.useState(user?.username ?? '');
  const [firstName, setFirstName] = React.useState(user?.firstName ?? '');
  const [lastName, setLastName] = React.useState(user?.lastName ?? '');
  const [password, setPassword] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const apiError = error instanceof ApiError ? error : undefined;

  /**
   * Unlike roles and permissions, this form has TWO unique fields, so it
   * cannot attribute every conflict to one of them. The API's messages name
   * the field ("A user with that email already exists."), so the generic
   * inference in api-error.ts is correct here and is used as-is.
   */
  const serverFieldError = (field: string) =>
    apiError?.field === field ? apiError.message : undefined;
  const serverGeneralError =
    apiError && !apiError.field ? apiError.message : undefined;

  const emailError =
    (touched && email.trim().length === 0
      ? 'Enter an email address.'
      : touched && !email.includes('@')
        ? 'Enter a valid email address.'
        : undefined) ?? serverFieldError('email');

  const usernameError =
    (touched && username.trim().length === 0
      ? 'Enter a username.'
      : undefined) ?? serverFieldError('username');

  const firstNameError =
    touched && firstName.trim().length === 0
      ? 'Enter a first name.'
      : undefined;
  const lastNameError =
    touched && lastName.trim().length === 0 ? 'Enter a last name.' : undefined;

  const passwordError =
    (!isEditing && touched && password.length < PASSWORD_MIN_LENGTH
      ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
      : undefined) ?? serverFieldError('password');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);

    const invalid =
      email.trim().length === 0 ||
      !email.includes('@') ||
      username.trim().length === 0 ||
      firstName.trim().length === 0 ||
      lastName.trim().length === 0 ||
      (!isEditing && password.length < PASSWORD_MIN_LENGTH);

    if (invalid) {
      return;
    }

    onSubmit({
      email: email.trim(),
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(isEditing ? {} : { password }),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="user-first-name"
          label="First name"
          error={firstNameError}
          required
        >
          {(props) => (
            <Input
              {...props}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              disabled={pending}
            />
          )}
        </FormField>

        <FormField
          id="user-last-name"
          label="Last name"
          error={lastNameError}
          required
        >
          {(props) => (
            <Input
              {...props}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              disabled={pending}
            />
          )}
        </FormField>
      </div>

      <FormField id="user-email" label="Email" error={emailError} required>
        {(props) => (
          <Input
            {...props}
            type="email"
            value={email}
            autoComplete="off"
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
          />
        )}
      </FormField>

      <FormField
        id="user-username"
        label="Username"
        error={usernameError}
        required
      >
        {(props) => (
          <Input
            {...props}
            value={username}
            autoComplete="off"
            onChange={(event) => setUsername(event.target.value)}
            disabled={pending}
          />
        )}
      </FormField>

      {isEditing ? null : (
        <FormField
          id="user-password"
          label="Password"
          description="At least 8 characters. It is never shown again."
          error={passwordError}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
            />
          )}
        </FormField>
      )}

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
          {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
}
