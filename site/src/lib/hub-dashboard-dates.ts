// =============================================================================
// Hub Home dashboard date math — pure functions, unit-testable
// =============================================================================
// Extracted from HubGreeting.astro / UpcomingEventsWidget.astro /
// AnnouncementsWidget.astro so the NaN / divide-by-zero / UTC-vs-Eastern edge
// cases each of those files guards against have automated regression coverage
// (see src/lib/hub-dashboard-dates.test.ts). The .astro components stay thin
// consumers of these functions.
// =============================================================================

/** Eastern wall-clock hour (0-23), not `now.getHours()` (UTC in Workers). */
export function nyHour(now: Date): number {
  return Number(
    now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hourCycle: 'h23',
    }),
  );
}

export function greetingForHour(hour: number): 'Good morning' | 'Good afternoon' | 'Good evening' {
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

/**
 * Whole-calendar-day count from `today` to a "YYYY-MM-DD" Sanity date string,
 * both normalized to UTC midnight — a day off at most near a midnight
 * boundary, which is fine for an at-a-glance chip, not a precise instant.
 */
export function daysUntil(iso: string | undefined, today: Date): number | null {
  if (!iso) return null;
  const todayUTC = new Date(`${today.toISOString().slice(0, 10)}T00:00:00Z`);
  const target = new Date(`${iso}T00:00:00Z`);
  return Math.ceil((target.getTime() - todayUTC.getTime()) / 86_400_000);
}

/**
 * School-year progress percent, or null when the bounds are unset or don't
 * form a real span (yearEnd must be strictly after yearStart) — guards the
 * denominator so an equal or inverted pair never divides by zero.
 */
export function yearProgressPercent(
  yearStart: string | undefined,
  yearEnd: string | undefined,
  today: Date,
): number | null {
  if (!yearStart || !yearEnd) return null;
  const startMs = new Date(`${yearStart}T00:00:00Z`).getTime();
  const endMs = new Date(`${yearEnd}T00:00:00Z`).getTime();
  const spanMs = endMs - startMs;
  if (spanMs <= 0) return null;
  const todayUTC = new Date(`${today.toISOString().slice(0, 10)}T00:00:00Z`);
  const pct = ((todayUTC.getTime() - startMs) / spanMs) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/** Short "Mon D" date, rendered in `timeZone` (event/update fmt() helpers). */
export function formatShortDate(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  });
}
