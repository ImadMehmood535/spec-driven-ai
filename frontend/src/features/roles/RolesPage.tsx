'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApiError } from '@/lib/api-error';
import { RoleForm, type RoleFormValues } from './RoleForm';
import { RolePermissionsDialog } from './RolePermissionsDialog';
import { useCreateRole, useRoleList, useUpdateRole } from './useRoleQueries';
import type { Role } from './types';

const PAGE_SIZE = 20;

export function RolesPage() {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<Role | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<Role | null>(null);
  const [managingPermissions, setManagingPermissions] =
    React.useState<Role | null>(null);

  const list = useRoleList({ search, page, size: PAGE_SIZE });
  const create = useCreateRole();
  const update = useUpdateRole();

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    create.reset();
    update.reset();
  };

  const handleCreate = (values: RoleFormValues) => {
    create.mutate(values, {
      onSuccess: () => {
        toast.success(`Role "${values.name}" created.`);
        closeForm();
      },
      onError: (error) => {
        // A field-level conflict is shown on the input, not as a toast, so the
        // user sees it where they can fix it.
        if (!(error instanceof ApiError) || !error.field) {
          toast.error('Could not create the role.');
        }
      },
    });
  };

  const handleEdit = (values: RoleFormValues) => {
    if (!editing) return;

    update.mutate(
      { id: editing.id, ...values },
      {
        onSuccess: () => {
          toast.success(`Role "${values.name}" updated.`);
          closeForm();
        },
        onError: (error) => {
          if (!(error instanceof ApiError) || !error.field) {
            toast.error('Could not update the role.');
          }
        },
      },
    );
  };

  const handleStatusChange = () => {
    if (!statusTarget) return;
    const next = statusTarget.entityStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    update.mutate(
      { id: statusTarget.id, entityStatus: next },
      {
        onSuccess: () => {
          toast.success(
            next === 'INACTIVE'
              ? `"${statusTarget.name}" deactivated.`
              : `"${statusTarget.name}" reactivated.`,
          );
          setStatusTarget(null);
        },
        onError: () => toast.error('Could not change the status.'),
      },
    );
  };

  const columns: ColumnDef<Role, unknown>[] = React.useMemo(
    () => [
      { id: 'name', accessorKey: 'name', header: 'Name', enableSorting: false },
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Description',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.description ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={row.original.entityStatus} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <PermissionGate permission="role.update">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Actions for ${row.original.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setManagingPermissions(row.original)}
                >
                  Permissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setStatusTarget(row.original)}
                >
                  {row.original.entityStatus === 'ACTIVE'
                    ? 'Deactivate'
                    : 'Reactivate'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
        ),
      },
    ],
    [],
  );

  const errorMessage =
    list.error instanceof ApiError
      ? list.error.message
      : list.error
        ? 'Could not load roles.'
        : undefined;

  const deactivating = statusTarget?.entityStatus === 'ACTIVE';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Roles"
        description="A user receives permissions through the single role assigned to them."
        actions={
          <PermissionGate permission="role.create">
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New role
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<Role>
        columns={columns}
        data={list.data?.items ?? []}
        meta={list.data?.meta}
        isLoading={list.isPending}
        errorMessage={errorMessage}
        onRetry={() => void list.refetch()}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Filter roles"
        onPageChange={setPage}
        isFiltered={search.trim().length > 0}
        emptyTitle="No roles yet"
        emptyDescription="Create a role, then assign it the permissions its holders should have."
        emptyAction={
          <PermissionGate permission="role.create">
            <Button onClick={() => setCreating(true)}>New role</Button>
          </PermissionGate>
        }
      />

      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit role' : 'New role'}</DialogTitle>
          </DialogHeader>
          <RoleForm
            role={editing ?? undefined}
            pending={create.isPending || update.isPending}
            error={editing ? update.error : create.error}
            onSubmit={editing ? handleEdit : handleCreate}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      <RolePermissionsDialog
        role={managingPermissions}
        onOpenChange={(open) => {
          if (!open) setManagingPermissions(null);
        }}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        title={deactivating ? 'Deactivate role?' : 'Reactivate role?'}
        description={
          deactivating
            ? // The consequence is invisible on this screen: users keep the
              // role, but FR-AC3 excludes everything reached through it.
              `Users keep the "${statusTarget?.name}" role, but it will grant them no permissions until it is reactivated.`
            : `"${statusTarget?.name}" will grant its permissions again to everyone assigned to it.`
        }
        confirmLabel={deactivating ? 'Deactivate' : 'Reactivate'}
        destructive={deactivating}
        pending={update.isPending}
        onConfirm={handleStatusChange}
      />
    </div>
  );
}
