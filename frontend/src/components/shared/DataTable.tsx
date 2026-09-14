'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Settings2 } from 'lucide-react';
import * as React from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/** Mirrors the API's PaginationMeta. */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  meta?: PaginationMeta;

  isLoading?: boolean;
  /** Already-normalised message from ApiError — never a raw status code. */
  errorMessage?: string;
  onRetry?: () => void;

  /** Text filter. Controlled, because filtering happens server-side. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  onPageChange?: (page: number) => void;

  /** Rendered beside the filter — status filters, and so on. */
  toolbar?: React.ReactNode;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  /** Distinguishes "nothing matches your filter" from "nothing exists yet". */
  isFiltered?: boolean;
}

/**
 * The one table in this project. Its props were designed against all three
 * screens — users, roles, permissions — so no screen needs to fork it
 * (FR-UI13). If a screen cannot express something here, these props are wrong
 * and this component changes.
 *
 * Pagination and filtering are server-side, matching the API's page/size
 * contract; the table never receives more than one page of rows.
 */
export function DataTable<TData>({
  columns,
  data,
  meta,
  isLoading = false,
  errorMessage,
  onRetry,
  search,
  onSearchChange,
  searchPlaceholder = 'Filter…',
  sorting = [],
  onSortingChange,
  onPageChange,
  toolbar,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Once something is created it will appear here.',
  emptyAction,
  isFiltered = false,
}: DataTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: meta?.totalPages ?? 0,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleSort = (columnId: string) => {
    if (!onSortingChange) return;
    const current = sorting.find((entry) => entry.id === columnId);
    onSortingChange(
      current
        ? current.desc
          ? []
          : [{ id: columnId, desc: true }]
        : [{ id: columnId, desc: false }],
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {onSearchChange ? (
          <Input
            value={search ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="sm:max-w-xs"
          />
        ) : null}

        {toolbar}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="sm:ml-auto">
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(Boolean(value))
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {errorMessage ? (
        <ErrorState message={errorMessage} onRetry={onRetry} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : data.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'No matches' : emptyTitle}
          description={
            isFiltered
              ? 'No records match the current filter. Try clearing it.'
              : emptyDescription
          }
          action={isFiltered ? undefined : emptyAction}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortable =
                      header.column.columnDef.enableSorting !== false &&
                      Boolean(onSortingChange);
                    const active = sorting.find(
                      (entry) => entry.id === header.column.id,
                    );

                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={
                          active
                            ? active.desc
                              ? 'descending'
                              : 'ascending'
                            : undefined
                        }
                      >
                        {header.isPlaceholder ? null : sortable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 h-8"
                            onClick={() => toggleSort(header.column.id)}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {active ? (
                              active.desc ? (
                                <ArrowDown
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ArrowUp
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                              )
                            ) : (
                              <ChevronsUpDown
                                className="h-3 w-3 opacity-50"
                                aria-hidden="true"
                              />
                            )}
                          </Button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 0 && !isLoading && !errorMessage ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.currentPage} of {meta.totalPages} · {meta.totalItems}{' '}
            {meta.totalItems === 1 ? 'record' : 'records'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage <= 1}
              onClick={() => onPageChange?.(meta.currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage >= meta.totalPages}
              onClick={() => onPageChange?.(meta.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
