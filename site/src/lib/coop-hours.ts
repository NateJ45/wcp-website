// =============================================================================
// Co-op hours — shared categories + pure progress math
// =============================================================================
// A cooperative preschool asks each family for a set number of volunteer hours
// a year. This module is the single source of truth for the ways hours are
// earned (used by the Studio schema, the log-hours API, and the hub page) and
// the pure math behind the progress bar. Kept framework-free with Vitest
// coverage for the divide-by-zero / NaN / negative edges (see the hub-date
// pattern the codebase already follows).
// =============================================================================

/** The ways a family earns co-op hours. `value` is stored; `title` is shown. */
export const HOURS_CATEGORIES = [
  { value: 'classroom', title: 'Classroom help' },
  { value: 'cleaning', title: 'Cleaning & maintenance' },
  { value: 'event', title: 'Event or fundraiser' },
  { value: 'committee', title: 'Committee or board work' },
  { value: 'donation', title: 'Donation in lieu of hours' },
  { value: 'other', title: 'Something else' },
] as const;

export type HoursCategory = (typeof HOURS_CATEGORIES)[number]['value'];

const CATEGORY_TITLES: Record<string, string> = Object.fromEntries(
  HOURS_CATEGORIES.map((c) => [c.value, c.title]),
);

/** Human label for a stored category value; falls back to the raw value. */
export function categoryLabel(value?: string | null): string {
  if (!value) return 'Other';
  return CATEGORY_TITLES[value] ?? 'Other';
}

/** True if `value` is one of the known category values. */
export function isHoursCategory(value?: string | null): value is HoursCategory {
  return !!value && value in CATEGORY_TITLES;
}

/**
 * Coerce an untrusted hours input to a sane number of hours: a finite value,
 * never negative, rounded to a quarter hour, capped so a typo (or abuse) can't
 * post a five-figure entry. Returns 0 for anything unparseable.
 */
export function normalizeHours(input: unknown): number {
  const n = typeof input === 'number' ? input : parseFloat(String(input ?? ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  const quartered = Math.round(n * 4) / 4;
  return Math.min(quartered, 999);
}

export interface HoursEntryLike {
  hours?: number | null;
  verified?: boolean | null;
}

/** Sum a set of entries, guarding against bad data. */
export function sumHours(entries: readonly HoursEntryLike[]): number {
  return entries.reduce((total, e) => total + normalizeHours(e.hours), 0);
}

export interface HoursProgress {
  /** Total across all entries (verified + pending). */
  logged: number;
  /** Only the board-confirmed portion. */
  verified: number;
  /** Logged but not yet confirmed. */
  pending: number;
  /** The family's annual goal (0 when none is set). */
  goal: number;
  /** 0-100, clamped; 0 when there's no goal (never NaN). */
  pct: number;
  /** Hours still owed against the goal (never negative). */
  remaining: number;
  /** True once logged hours reach the goal (and a goal exists). */
  met: boolean;
}

/**
 * Roll a family's entries up against the annual goal. All outputs are clamped
 * so a zero/absent goal never divides by zero or renders NaN, matching
 * HubProgress's own guard.
 */
export function summarizeHours(
  entries: readonly HoursEntryLike[],
  goalInput: unknown,
): HoursProgress {
  const verified = sumHours(entries.filter((e) => e.verified));
  const logged = sumHours(entries);
  const pending = Math.max(0, logged - verified);
  const goal = normalizeHours(goalInput);
  const pct = goal > 0 ? Math.min(100, Math.max(0, Math.round((logged / goal) * 100))) : 0;
  const remaining = goal > 0 ? Math.max(0, Math.round((goal - logged) * 4) / 4) : 0;
  return { logged, verified, pending, goal, pct, remaining, met: goal > 0 && logged >= goal };
}
