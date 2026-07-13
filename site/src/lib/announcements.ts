// =============================================================================
// Announcements — shared types + pure helpers (bars & popups)
// =============================================================================
// Rendering lives in AnnouncementBars.astro / AnnouncementModal.astro; the
// logic that's easy to get wrong (time windows, per-page placement, the
// waitlist auto-message) is here as pure, unit-tested functions.
// =============================================================================
import { classLabel } from '@/lib/class-colors';
import type { ClassAvailability, AvailabilityStatus } from '@/lib/gsheets';

export interface Announcement {
  _id: string;
  title?: string;
  format?: 'bar' | 'popup';
  template?: string;
  message?: string;
  tone?: string;
  icon?: string;
  heading?: string;
  linkLabel?: string;
  linkType?: 'page' | 'url';
  pageSlug?: string;
  url?: string;
  showFrom?: string;
  showUntil?: string;
  priority?: number;
  placement?: 'all' | 'only' | 'except';
  pageSlugs?: (string | null)[];
  frequency?: 'once' | 'session' | 'always';
  version?: string;
  image?: unknown;
}

/** Is `now` within [showFrom, showUntil]? Blank bounds are open. */
export function isInWindow(nowMs: number, showFrom?: string, showUntil?: string): boolean {
  const from = showFrom ? new Date(showFrom).getTime() : -Infinity;
  const until = showUntil ? new Date(showUntil).getTime() : Infinity;
  return nowMs >= from && nowMs <= until;
}

/** Normalize a path/slug for comparison: leading slash, no trailing slash,
 *  lowercase; a page slug of "home" and "" both mean the site root "/". */
export function normalizePath(input: string): string {
  let p = (input || '').trim().toLowerCase();
  if (p === '' || p === 'home' || p === '/home') return '/';
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

/** Does this announcement apply to the given page path? */
export function matchesPlacement(a: Announcement, currentPath: string): boolean {
  if (!a.placement || a.placement === 'all') return true;
  const here = normalizePath(currentPath);
  const targets = (a.pageSlugs ?? [])
    .filter((s): s is string => typeof s === 'string')
    .map(normalizePath);
  const listed = targets.includes(here);
  return a.placement === 'only' ? listed : !listed;
}

// A compact, on-brand summary of enrollment status from the availability data.
// e.g. "Now enrolling — Threes & Pre-K AM open, Twos waitlist". Groups classes
// by status so the line stays short. Returns '' when there's nothing to say.
const STATUS_WORD: Record<AvailabilityStatus, string> = {
  open: 'open',
  few: 'a few spots',
  waitlist: 'waitlist',
  full: 'full',
};
// Order statuses good-news-first.
const STATUS_ORDER: AvailabilityStatus[] = ['open', 'few', 'waitlist', 'full'];

export function waitlistMessage(items: ClassAvailability[]): string {
  if (!items.length) return '';
  const byStatus = new Map<AvailabilityStatus, string[]>();
  for (const it of items) {
    const list = byStatus.get(it.status) ?? [];
    list.push(classLabel(it.slug));
    byStatus.set(it.status, list);
  }
  const parts: string[] = [];
  for (const status of STATUS_ORDER) {
    const names = byStatus.get(status);
    if (names && names.length) {
      parts.push(`${joinNames(names)} ${STATUS_WORD[status]}`);
    }
  }
  if (!parts.length) return '';
  return `Now enrolling — ${parts.join(', ')}.`;
}

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}
