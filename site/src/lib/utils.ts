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

/**
 * formatDate — a human date like "March 4, 2026" from an ISO string.
 * Fixed to en-US + UTC so the build and the browser agree (avoids a date
 * shifting by a day depending on the server's timezone). Used by News posts
 * and Events.
 */
export function formatDate(iso: string | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
    ...opts,
  });
}
