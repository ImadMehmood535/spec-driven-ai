'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-error';
import { useChangePassword } from './useUserQueries';
import type { User } from './types';

const PASSWORD_MIN_LENGTH = 8;

/**
 * An administrator setting a password for a user (D-9). Deliberately separate
 * from the edit form: a credential must not arrive in a general-purpose body.
 * Not a reset flow — no current-password challenge, no token.
 */
export function ChangePasswordDialog({
  user,
  onOpenChange,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const changePassword = useChangePassword();

  React.useEffect(() => {
    if (!user) {
      setPassword('');
      setTouched(false);
      changePassword.reset();
    }
    // Resetting when the dialog closes keeps a previous value from reappearing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const error =
    touched && password.length < PASSWORD_MIN_LENGTH
      ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
      : changePassword.error instanceof ApiError
        ? changePassword.error.message
        : undefined;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);

    if (!user || password.length < PASSWORD_MIN_LENGTH) {
      return;
    }

    changePassword.mutate(
      { id: user.id, newPassword: password },
      {
        onSuccess: () => {
          // The new value is never echoed, here or anywhere else.
          toast.success(`Password updated for ${user.username}.`);
          onOpenChange(false);
        },
        onError: () => toast.error('Could not change the password.'),
      },
    );
  };

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Set a new password for {user?.username}. They are not told
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <FormField
              id="new-password"
              label="New password"
              error={error}
              required
            >
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={changePassword.isPending}
                />
              )}
            </FormField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changePassword.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Saving…' : 'Change password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
