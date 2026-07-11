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

/**
 * withBase — prefix an internal, root-relative link with a base path.
 *
 * Used to keep navigation inside Sanity's Presentation preview: in preview
 * context `base` is "/preview", so "/about" becomes "/preview/about" while
 * external URLs, mailto:/tel:, and on-page #anchors are left untouched. In
 * production `base` is "" and every href passes through unchanged.
 */
export function withBase(href: string | undefined, base = ''): string {
  const h = href ?? '';
  if (!base) return h;
  // Only rewrite site-internal, root-relative paths.
  if (!h.startsWith('/')) return h; // external, mailto:, tel:, #anchor, relative
  if (h.startsWith('//')) return h; // protocol-relative external
  if (h === base || h.startsWith(`${base}/`)) return h; // already prefixed
  return `${base}${h}`;
}
