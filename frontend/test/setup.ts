import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
import { server } from './msw/server';

expect.extend(toHaveNoViolations);

// jsdom implements neither, and next-themes and responsive components use them.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }),
});

// next/link observes visibility to decide when to prefetch. jsdom has no
// IntersectionObserver, so Link updates state outside act() and every test
// logs a warning. A stub that never reports intersection keeps the prefetch
// path deterministic and silent.
class NoopIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
