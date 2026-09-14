'use client';

import { Check } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRoleList } from '@/features/roles/useRoleQueries';
import { cn } from '@/lib/utils';
import { useAssignRole } from './useUserQueries';
import type { User } from './types';

/**
 * One role per user (§6). A single-value control, never a multi-select —
 * offering checkboxes would imply a capability the module does not have.
 */
export function AssignRoleDialog({
  user,
  onOpenChange,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = React.useState('');
  const roles = useRoleList({ search, page: 1, size: 50 });
  const assignRole = useAssignRole();

  React.useEffect(() => {
    if (!user) setSearch('');
  }, [user]);

  const assign = (roleId: number | null, roleName: string) => {
    if (!user) return;

    assignRole.mutate(
      { id: user.id, roleId },
      {
        onSuccess: () => {
          toast.success(
            roleId === null
              ? `${user.username} no longer has a role.`
              : `${user.username} now has the ${roleName} role.`,
          );
          onOpenChange(false);
        },
        onError: () => toast.error('Could not change the role.'),
      },
    );
  };

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user?.roleId === null ? 'Assign role' : 'Change role'}
          </DialogTitle>
          <DialogDescription>
            A user has one role. Choosing another replaces{' '}
            {user?.roleName ? `"${user.roleName}"` : 'the current selection'}.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search roles"
          aria-label="Search roles"
        />

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {roles.data?.items.map((role) => {
            const current = role.id === user?.roleId;

            return (
              <li key={role.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-2',
                    current && 'bg-accent',
                  )}
                  disabled={assignRole.isPending || current}
                  onClick={() => assign(role.id, role.name)}
                >
                  {current ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span className="h-4 w-4" aria-hidden="true" />
                  )}
                  {role.name}
                  {current ? (
                    <span className="sr-only">(current role)</span>
                  ) : null}
                </Button>
              </li>
            );
          })}
        </ul>

        {user?.roleId !== null ? (
          <Button
            variant="outline"
            disabled={assignRole.isPending}
            onClick={() => assign(null, '')}
          >
            Remove role
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
