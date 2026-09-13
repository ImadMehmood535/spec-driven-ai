'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { ApiError } from '@/lib/api-error';

/**
 * One query client for the app. Retrying a 401/403/404 is pointless and makes
 * the UI feel broken, so only genuine transport failures are retried.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.kind !== 'network') {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(createQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
