import { Badge } from '@/components/ui/badge';

export type EntityStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Carries the word, not just a colour. Colour-only status is unreadable for
 * colour-blind users and in high-contrast modes, which the standards forbid.
 */
export function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';

  return (
    <Badge variant={isActive ? 'secondary' : 'muted'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
