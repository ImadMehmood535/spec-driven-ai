'use client';

import { Plus, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePermissionList } from '@/features/permissions/usePermissionQueries';
import { ApiError } from '@/lib/api-error';
import {
  useAssignPermissions,
  useRemovePermission,
  useRolePermissions,
} from './useRoleQueries';
import type { Role, RolePermission } from './types';

export interface RolePermissionsDialogProps {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * A role's permissions (FR-UI4). Assignment searches the unassigned catalogue
 * rather than offering a long unfiltered list — the standards call that out,
 * and the catalogue only grows.
 */
export function RolePermissionsDialog({
  role,
  onOpenChange,
}: RolePermissionsDialogProps) {
  const roleId = role?.id ?? null;
  const [search, setSearch] = React.useState('');
  const [removing, setRemoving] = React.useState<RolePermission | null>(null);

  const assigned = useRolePermissions(roleId);
  // Only the active catalogue is offered — assigning a deactivated permission
  // would grant nothing (FR-AC3).
  const catalogue = usePermissionList({
    search,
    entityStatus: 'ACTIVE',
    page: 1,
    size: 50,
  });
  const assign = useAssignPermissions(roleId);
  const remove = useRemovePermission(roleId);

  React.useEffect(() => {
    if (!role) {
      setSearch('');
      setRemoving(null);
    }
  }, [role]);

  const assignedIds = new Set(
    (assigned.data?.items ?? []).map((item) => item.permissionId),
  );

  /**
   * Already-assigned permissions are not offered, so the 409 path is
   * unreachable through normal use. It is still handled, because another
   * administrator could assign concurrently.
   */
  const unassigned = (catalogue.data?.items ?? []).filter(
    (permission) => !assignedIds.has(permission.id),
  );

  const handleAssign = (permissionId: number, name: string) => {
    assign.mutate([permissionId], {
      onSuccess: () => toast.success(`"${name}" assigned to ${role?.name}.`),
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Could not assign the permission.',
        ),
    });
  };

  const handleRemove = () => {
    if (!removing) return;

    remove.mutate(removing.permissionId, {
      onSuccess: () => {
        toast.success(`"${removing.name}" removed from ${role?.name}.`);
        setRemoving(null);
      },
      onError: () => toast.error('Could not remove the permission.'),
    });
  };

  return (
    <>
      <Dialog open={role !== null} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Permissions for {role?.name}</DialogTitle>
            <DialogDescription>
              Everyone assigned this role receives these permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 sm:grid-cols-2">
            <section aria-labelledby="assigned-heading" className="space-y-2">
              <h3 id="assigned-heading" className="text-sm font-medium">
                Assigned
              </h3>

              {assigned.isPending ? (
                <div className="space-y-2" data-testid="assigned-skeleton">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : assigned.error ? (
                <ErrorState
                  message="Could not load this role's permissions."
                  onRetry={() => void assigned.refetch()}
                />
              ) : (assigned.data?.items.length ?? 0) === 0 ? (
                <EmptyState
                  title="No permissions"
                  description="This role grants nothing until you assign a permission."
                />
              ) : (
                <ul className="space-y-1">
                  {assigned.data?.items.map((item) => (
                    <li
                      key={item.linkId}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <span className="text-sm">{item.name}</span>
                      <PermissionGate permission="role-permission.remove">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => setRemoving(item)}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </PermissionGate>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <PermissionGate
              permission="role-permission.assign"
              fallback={
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Available</h3>
                  <p className="text-sm text-muted-foreground">
                    You do not have permission to assign permissions.
                  </p>
                </section>
              }
            >
              <section
                aria-labelledby="available-heading"
                className="space-y-2"
              >
                <h3 id="available-heading" className="text-sm font-medium">
                  Available
                </h3>

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search permissions"
                  aria-label="Search permissions"
                />

                {catalogue.isPending ? (
                  <div className="space-y-2" data-testid="catalogue-skeleton">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : unassigned.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    {search.trim().length > 0
                      ? 'No unassigned permissions match that search.'
                      : 'Every active permission is already assigned.'}
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-1 overflow-y-auto">
                    {unassigned.map((permission) => (
                      <li key={permission.id}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2"
                          disabled={assign.isPending}
                          onClick={() =>
                            handleAssign(permission.id, permission.name)
                          }
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          {permission.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </PermissionGate>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Remove permission from role?"
        /**
         * D-8: removal deactivates the link rather than erasing it, and
         * re-adding later is an ordinary assign. The copy says what changes,
         * not that something is destroyed.
         */
        description={`"${removing?.name}" will no longer apply to anyone with the ${role?.name} role. You can assign it again later.`}
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={handleRemove}
      />
    </>
  );
}
