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
import { AssignRoleDialog } from './AssignRoleDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { UserForm, type UserFormValues } from './UserForm';
import { useCreateUser, useUpdateUser, useUserList } from './useUserQueries';
import type { User } from './types';

const PAGE_SIZE = 20;

export function UsersPage() {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<User | null>(null);
  const [roleTarget, setRoleTarget] = React.useState<User | null>(null);
  const [passwordTarget, setPasswordTarget] = React.useState<User | null>(null);

  const list = useUserList({ search, page, size: PAGE_SIZE });
  const create = useCreateUser();
  const update = useUpdateUser();

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    create.reset();
    update.reset();
  };

  const handleCreate = (values: UserFormValues) => {
    create.mutate(
      {
        email: values.email,
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password ?? '',
        roleId: null,
      },
      {
        onSuccess: () => {
          // The password is never echoed back, here or in any other message.
          toast.success(`User "${values.username}" created.`);
          closeForm();
        },
        onError: (error) => {
          if (!(error instanceof ApiError) || !error.field) {
            toast.error('Could not create the user.');
          }
        },
      },
    );
  };

  const handleEdit = (values: UserFormValues) => {
    if (!editing) return;

    update.mutate(
      {
        id: editing.id,
        email: values.email,
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
      },
      {
        onSuccess: () => {
          toast.success(`User "${values.username}" updated.`);
          closeForm();
        },
        onError: (error) => {
          if (!(error instanceof ApiError) || !error.field) {
            toast.error('Could not update the user.');
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
              ? `${statusTarget.username} deactivated.`
              : `${statusTarget.username} reactivated.`,
          );
          setStatusTarget(null);
        },
        onError: () => toast.error('Could not change the status.'),
      },
    );
  };

  const columns: ColumnDef<User, unknown>[] = React.useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        enableSorting: false,
        cell: ({ row }) => (
          <span>
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      {
        id: 'username',
        accessorKey: 'username',
        header: 'Username',
        enableSorting: false,
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: 'Email',
        enableSorting: false,
      },
      {
        id: 'role',
        header: 'Role',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.roleName ?? (
            // FR-AC4: no role means no permissions. Saying so is clearer than
            // an empty cell, which reads as missing data.
            <span className="text-muted-foreground">No role</span>
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
          <PermissionGate permission="user.update">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Actions for ${row.original.username}`}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRoleTarget(row.original)}>
                  {row.original.roleId === null ? 'Assign role' : 'Change role'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setPasswordTarget(row.original)}
                >
                  Change password
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
        ? 'Could not load users.'
        : undefined;

  const deactivating = statusTarget?.entityStatus === 'ACTIVE';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Users"
        description="Each user receives permissions through the single role assigned to them."
        actions={
          <PermissionGate permission="user.create">
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New user
            </Button>
          </PermissionGate>
        }
      />

      <DataTable<User>
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
        searchPlaceholder="Filter users"
        onPageChange={setPage}
        isFiltered={search.trim().length > 0}
        emptyTitle="No users yet"
        emptyDescription="Create a user, then assign the role whose permissions they should have."
        emptyAction={
          <PermissionGate permission="user.create">
            <Button onClick={() => setCreating(true)}>New user</Button>
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
            <DialogTitle>{editing ? 'Edit user' : 'New user'}</DialogTitle>
          </DialogHeader>
          <UserForm
            user={editing ?? undefined}
            pending={create.isPending || update.isPending}
            error={editing ? update.error : create.error}
            onSubmit={editing ? handleEdit : handleCreate}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      <AssignRoleDialog
        user={roleTarget}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
      />

      <ChangePasswordDialog
        user={passwordTarget}
        onOpenChange={(open) => {
          if (!open) setPasswordTarget(null);
        }}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        title={deactivating ? 'Deactivate user?' : 'Reactivate user?'}
        description={
          deactivating
            ? // FR-U7: a deactivated user cannot authenticate. That is the
              // consequence worth naming, since nothing else on this screen
              // shows it.
              `${statusTarget?.username} will no longer be able to sign in. Their role and details are kept.`
            : `${statusTarget?.username} will be able to sign in again.`
        }
        confirmLabel={deactivating ? 'Deactivate' : 'Reactivate'}
        destructive={deactivating}
        pending={update.isPending}
        onConfirm={handleStatusChange}
      />
    </div>
  );
}
