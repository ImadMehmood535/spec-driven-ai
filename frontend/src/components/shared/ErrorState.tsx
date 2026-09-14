'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  /** What failed, in the user's terms — never a raw status code. */
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 p-10 text-center"
    >
      <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
      <p className="max-w-sm text-sm">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
