import { PaginationMeta } from './PaginationMeta';

describe('PaginationMeta.of', () => {
  it('carries the supplied values', () => {
    const meta = PaginationMeta.of(2, 50, 123);

    expect(meta.currentPage).toBe(2);
    expect(meta.pageSize).toBe(50);
    expect(meta.totalItems).toBe(123);
  });

  it('rounds totalPages up for a partial last page', () => {
    expect(PaginationMeta.of(1, 50, 123).totalPages).toBe(3);
  });

  it('does not add a page for an exact multiple', () => {
    expect(PaginationMeta.of(1, 50, 100).totalPages).toBe(2);
  });

  it('reports no pages for an empty result', () => {
    expect(PaginationMeta.of(1, 50, 0).totalPages).toBe(0);
  });

  it('avoids dividing by zero when pageSize is zero', () => {
    expect(PaginationMeta.of(1, 0, 10).totalPages).toBe(0);
  });
});
