import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ThemeProvider } from 'next-themes';
import * as React from 'react';

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  'wrapper'
> {
  /** 'dark' renders inside the dark class, for theme-dependent assertions. */
  theme?: 'light' | 'dark';
  /** Override router methods a test needs to assert on, e.g. push. */
  router?: Partial<AppRouterInstance>;
}

/**
 * The ONE shared render helper. The testing standards call for a single helper
 * providing query client, theme and router — a bespoke wrapper per test file
 * is the duplication FR-UI13 forbids, applied to tests.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { theme = 'light', router, ...options }: RenderWithProvidersOptions = {},
): RenderResult & { queryClient: QueryClient; router: AppRouterInstance } {
  // Retries off: a test asserting an error state should not wait for them.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  // Next's Link and useRouter need a router in context. Without one they
  // update outside act() and any navigation assertion is impossible.
  const appRouter: AppRouterInstance = {
    push: () => undefined,
    replace: () => undefined,
    refresh: () => undefined,
    back: () => undefined,
    forward: () => undefined,
    prefetch: () => undefined,
    ...router,
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppRouterContext.Provider value={appRouter}>
        <ThemeProvider
          attribute="class"
          defaultTheme={theme}
          enableSystem={false}
        >
          <QueryClientProvider client={queryClient}>
            <div className={theme}>{children}</div>
          </QueryClientProvider>
        </ThemeProvider>
      </AppRouterContext.Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
    router: appRouter,
  };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
