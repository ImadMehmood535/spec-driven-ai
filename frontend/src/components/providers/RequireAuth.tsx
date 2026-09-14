'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { TableSkeleton } from '@/components/shared/TableSkeleton';

/**
 * Client-side, because the session lives in browser storage (D-10) — Next
 * middleware cannot read it.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { claims, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (ready && !claims) {
      router.replace('/login');
    }
  }, [claims, ready, router]);

  // Until the stored token has been read we know nothing, so showing either
  // the app or a redirect would be a guess.
  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-5xl py-6">
        <TableSkeleton rows={3} columns={3} />
      </div>
    );
  }

  if (!claims) {
    return null;
  }

  return <>{children}</>;
}
