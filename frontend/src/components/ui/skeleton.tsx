import { cn } from '@/lib/utils';

/**
 * Shaped like the content it replaces. A bare spinner tells the user nothing
 * about what is coming, which is why the standards require skeletons for
 * initial load.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
