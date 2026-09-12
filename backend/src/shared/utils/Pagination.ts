export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export function resolvePage(value?: string): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_PAGE;
}

export function resolvePageSize(value?: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(n, MAX_PAGE_SIZE);
}
