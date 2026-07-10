import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge conditional Tailwind classes safely.
 * clsx resolves conditionals/arrays; tailwind-merge dedupes conflicting
 * utilities (e.g. `px-2 px-4` -> `px-4`). Used by every shadcn component.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
