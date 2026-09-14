'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/features/auth/useLogin';
import { ApiError } from '@/lib/api-error';

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const login = useLogin((token) => {
    signIn(token);
    router.replace('/');
  });

  const identifierError =
    touched && identifier.trim().length === 0
      ? 'Enter your email or username.'
      : undefined;
  const passwordError =
    touched && password.length === 0 ? 'Enter your password.' : undefined;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);

    if (identifier.trim().length === 0 || password.length === 0) {
      return;
    }

    login.mutate({ identifier: identifier.trim(), password });
  };

  /**
   * The API returns one uniform message for an unknown user, a wrong password
   * and a deactivated account. Elaborating on it here would recreate the
   * enumeration oracle the API deliberately avoids, so it is shown verbatim.
   */
  const failureMessage =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? 'Could not sign in. Please try again.'
        : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <FormField
        id="identifier"
        label="Email or username"
        error={identifierError}
        required
      >
        {(props) => (
          <Input
            {...props}
            value={identifier}
            autoComplete="username"
            onChange={(event) => setIdentifier(event.target.value)}
            disabled={login.isPending}
          />
        )}
      </FormField>

      <FormField id="password" label="Password" error={passwordError} required>
        {(props) => (
          <Input
            {...props}
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            disabled={login.isPending}
          />
        )}
      </FormField>

      {failureMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {failureMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
