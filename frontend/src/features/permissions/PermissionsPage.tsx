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
import { PermissionForm, type PermissionFormValues } from './PermissionForm';
import {
  useCreatePermission,
  usePermissionList,
  useUpdatePermission,
} from './usePermissionQueries';
import type { Permission } from './types';

const PAGE_SIZE = 20;

export function PermissionsPage() {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<Permission | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<Permission | null>(
    null,
  );

  const list = usePermissionList({ search, page, size: PAGE_SIZE });
  const create = useCreatePermission();
  const update = useUpdatePermission();

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    create.reset();
    update.reset();
  };

  const handleCreate = (values: PermissionFormValues) => {
    create.mutate(values, {
      onSuccess: () => {
        toast.success(`Permission "${values.name}" created.`);
        closeForm();
      },
      onError: (error) => {
        // A field-level conflict is shown on the input, not as a toast, so the
        // user sees it where they can fix it.
        if (!(error instanceof ApiError) || !error.field) {
          toast.error('Could not create the permission.');
        }
      },
    });
  };

  const handleEdit = (values: PermissionFormValues) => {
    if (!editing) return;

    update.mutate(
      { id: editing.id, ...values },
      {
        onSuccess: () => {
          toast.success(`Permission "${values.name}" updated.`);
          closeForm();
        },
        onError: (error) => {
          if (!(error instanceof ApiError) || !error.field) {
            toast.error('Could not update the permission.');
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

  const columns: ColumnDef<Permission, unknown>[] = React.useMemo(
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
          <PermissionGate permission="permission.update">
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
        ? 'Could not load permissions.'
        : undefined;

  const deactivating = statusTarget?.entityStatus === 'ACTIVE';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Permissions"
        description="The actions the Developer platform can authorise. Roles grant these to users."
        actions={
          <PermissionGate permission="permission.create">
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New permission
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<Permission>
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
        searchPlaceholder="Filter permissions"
        onPageChange={setPage}
        isFiltered={search.trim().length > 0}
        emptyTitle="No permissions yet"
        emptyDescription="Create a permission to describe an action the platform can authorise."
        emptyAction={
          <PermissionGate permission="permission.create">
            <Button onClick={() => setCreating(true)}>New permission</Button>
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
            <DialogTitle>
              {editing ? 'Edit permission' : 'New permission'}
            </DialogTitle>
          </DialogHeader>
          <PermissionForm
            permission={editing ?? undefined}
            pending={create.isPending || update.isPending}
            error={editing ? update.error : create.error}
            onSubmit={editing ? handleEdit : handleCreate}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        title={
          deactivating ? 'Deactivate permission?' : 'Reactivate permission?'
        }
        description={
          deactivating
            ? `"${statusTarget?.name}" will stop granting access immediately, for every role that holds it.`
            : `"${statusTarget?.name}" will grant access again wherever it is assigned.`
        }
        confirmLabel={deactivating ? 'Deactivate' : 'Reactivate'}
        destructive={deactivating}
        pending={update.isPending}
        onConfirm={handleStatusChange}
      />
    </div>
  );
}
