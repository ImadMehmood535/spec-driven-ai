import type { ColumnDef } from '@tanstack/react-table';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent, within } from '@test/render';
import { Button } from '@/components/ui/button';
import { DataTable, type PaginationMeta } from './DataTable';

interface Row {
  id: number;
  name: string;
  status: string;
}

const columns: ColumnDef<Row, unknown>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'status', accessorKey: 'status', header: 'Status' },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: () => <Button size="sm">Row actions</Button>,
  },
];

const rows: Row[] = [
  { id: 1, name: 'project.create', status: 'ACTIVE' },
  { id: 2, name: 'project.view', status: 'INACTIVE' },
];

const meta: PaginationMeta = {
  currentPage: 2,
  pageSize: 10,
  totalItems: 25,
  totalPages: 3,
};

const table = (props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) => (
  <DataTable<Row> columns={columns} data={rows} {...props} />
);

describe('DataTable — rendering', () => {
  it('renders a row per record', () => {
    renderWithProviders(table());

    expect(screen.getByText('project.create')).toBeInTheDocument();
    expect(screen.getByText('project.view')).toBeInTheDocument();
  });

  it('renders row actions supplied by the column definition (FR-UI8)', () => {
    renderWithProviders(table());

    expect(screen.getAllByRole('button', { name: 'Row actions' })).toHaveLength(
      2,
    );
  });
});

describe('DataTable — the required states (FR-UI7)', () => {
  it('shows a skeleton while loading, not a spinner', () => {
    renderWithProviders(table({ data: [], isLoading: true }));

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an empty state explaining how to fill it', () => {
    renderWithProviders(
      table({
        data: [],
        emptyTitle: 'No permissions yet',
        emptyDescription: 'Create one to begin.',
      }),
    );

    expect(screen.getByText('No permissions yet')).toBeInTheDocument();
    expect(screen.getByText('Create one to begin.')).toBeInTheDocument();
  });

  it('distinguishes "no matches" from "nothing exists yet"', () => {
    renderWithProviders(table({ data: [], isFiltered: true }));

    // Telling a user "create your first record" when they have simply typed a
    // filter that matches nothing is misleading.
    expect(screen.getByText('No matches')).toBeInTheDocument();
    expect(screen.getByText(/clearing it/i)).toBeInTheDocument();
  });

  it('shows an error with retry, and prefers it over the empty state', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      table({ data: [], errorMessage: 'Could not load records.', onRetry }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load records.',
    );
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('DataTable — filtering (FR-UI8)', () => {
  it('reports what the user types', async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      table({ search: '', onSearchChange, searchPlaceholder: 'Filter names' }),
    );

    await user.type(screen.getByLabelText('Filter names'), 'p');

    expect(onSearchChange).toHaveBeenCalledWith('p');
  });

  it('omits the filter when the screen does not support one', () => {
    renderWithProviders(table());

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('DataTable — sorting (FR-UI8)', () => {
  it('sorts ascending on first activation', async () => {
    const onSortingChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(table({ sorting: [], onSortingChange }));

    await user.click(screen.getByRole('button', { name: /name/i }));

    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
  });

  it('toggles to descending, then clears', async () => {
    const onSortingChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      table({ sorting: [{ id: 'name', desc: false }], onSortingChange }),
    );

    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: true }]);

    rerender(table({ sorting: [{ id: 'name', desc: true }], onSortingChange }));
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortingChange).toHaveBeenLastCalledWith([]);
  });

  it('exposes the sort direction to assistive technology', () => {
    renderWithProviders(
      table({
        sorting: [{ id: 'name', desc: true }],
        onSortingChange: vi.fn(),
      }),
    );

    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('does not make a non-sortable column sortable', () => {
    renderWithProviders(table({ onSortingChange: vi.fn() }));

    const actions = screen.getByRole('columnheader', { name: /actions/i });
    expect(within(actions).queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('DataTable — pagination (FR-UI8)', () => {
  it('reports the position and total', () => {
    renderWithProviders(table({ meta }));

    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/25 records/i)).toBeInTheDocument();
  });

  it('moves between pages', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(table({ meta, onPageChange }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on the first page', () => {
    renderWithProviders(table({ meta: { ...meta, currentPage: 1 } }));

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('disables Next on the last page', () => {
    renderWithProviders(table({ meta: { ...meta, currentPage: 3 } }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('uses the singular for a single record', () => {
    renderWithProviders(
      table({
        meta: { ...meta, totalItems: 1, totalPages: 1, currentPage: 1 },
      }),
    );

    expect(screen.getByText(/1 record$/i)).toBeInTheDocument();
  });

  it('hides pagination while loading', () => {
    renderWithProviders(table({ meta, isLoading: true, data: [] }));

    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });
});

describe('DataTable — column visibility (FR-UI8)', () => {
  it('hides a column when toggled off', async () => {
    const user = userEvent.setup();
    renderWithProviders(table());

    await user.click(screen.getByRole('button', { name: /columns/i }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'status' }));

    expect(
      screen.queryByRole('columnheader', { name: 'Status' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /name/i }),
    ).toBeInTheDocument();
  });
});

describe('DataTable — accessibility', () => {
  it('is keyboard operable (FR-UI11)', async () => {
    const user = userEvent.setup();
    renderWithProviders(table({ meta, onPageChange: vi.fn() }));

    await user.tab();

    expect(document.activeElement).not.toBe(document.body);
  });

  it.each(['light', 'dark'] as const)(
    'has no violations in the %s theme',
    async (theme) => {
      const { container } = renderWithProviders(table({ meta }), { theme });

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
