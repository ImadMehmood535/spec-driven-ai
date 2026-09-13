import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Written once. A second copy of this anywhere is a defect (FR-UI13). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
