'use client';

import { usePathname } from 'next/navigation';
import * as React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/components/providers/RequireAuth';

/** Routes reachable without a session. */
const PUBLIC_ROUTES = ['/login'];

/**
 * Login must render outside both the guard and the shell — inside the guard it
 * would redirect to itself, and inside the shell it would show navigation to a
 * user who cannot use it.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname ?? '')) {
    return <main className="px-4 py-6 sm:px-6">{children}</main>;
  }

  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
