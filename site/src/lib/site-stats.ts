// =============================================================================
// site-stats — day bucketing and response shaping for the "Site stats" tool
// =============================================================================
// PURE. No Worker globals, no fetch, no Sanity. It is imported by BOTH the SSR
// endpoint (src/pages/api/stats.ts) and the Studio tool
// (src/sanity/components/StatsTool.tsx), so it must stay runnable in a plain
// browser bundle. Everything that talks to Cloudflare lives in the endpoint.
//
// WHAT THE NUMBERS ARE (read this before changing any label)
// The site is a Worker on workers.dev with NO zone attached, so the only
// analytics dataset available is the account-level Workers one. It counts
// REQUESTS the Worker answered. It carries no URL, so a page view, a picture,
// a font and an /api call all look the same. That is why every label says
// "visits to the site (requests served)" and never "page views". Do not
// upgrade the wording without a dataset that actually knows about paths (a
// custom domain would unlock the zone-side httpRequestsAdaptiveGroups, which
// does carry paths).
//
// BUCKETING
// Cloudflare returns one row per time bucket. Two row shapes are possible
// depending on which time dimension the dataset accepts (`date`, or
// `datetimeHour` as the fallback), so `bucketDay()` takes the leading 10
// characters of whichever field is present: both are ISO strings that start
// with YYYY-MM-DD in UTC. Everything downstream works in UTC days. The school
// is in Pennsylvania (UTC-4/-5), so a "day" here starts in the late evening
// local time. That is fine for a week-over-week comparison and is stated in
// the tool's own note; it is NOT fine for "how many people came this morning",
// which this panel deliberately does not answer.
//
// A missing day is a REAL zero (a quiet Sunday), not missing data, so the
// window is always filled end to end. That keeps the bar chart honest: gaps
// would read as "the chart is broken", zeros read as "nobody came".
// =============================================================================

/** How many days the panel shows. 28 = four whole weeks, so week-over-week
 *  comparison is apples to apples. Cloudflare keeps ~30 days of this data. */
export const STATS_DAYS = 28;

/** The shorter headline window, in days. */
export const STATS_SHORT_DAYS = 7;

/** How long a Cloudflare answer is reused inside one Worker isolate.
 *  Ten minutes: the numbers move slowly and an editor may click around. */
export const STATS_TTL_MS = 10 * 60 * 1000;

export interface StatsDay {
  /** UTC calendar day, "YYYY-MM-DD". */
  date: string;
  requests: number;
  errors: number;
}

export interface StatsTotals {
  days: number;
  requests: number;
  errors: number;
}

export interface SiteStats {
  ok: true;
  /** The Worker whose requests these are. */
  scriptName: string;
  /** Inclusive UTC day window, "YYYY-MM-DD". */
  since: string;
  until: string;
  /** Exactly STATS_DAYS entries, oldest first, zero-filled. */
  days: StatsDay[];
  last7: StatsTotals;
  last28: StatsTotals;
  /** When the numbers were read from Cloudflare (ISO). Lets the tool say
   *  "as of ..." instead of implying the panel is live. */
  fetchedAt: string;
}

/** One row as Cloudflare returns it. Both time dimensions are optional
 *  because the endpoint may have used either. */
export interface StatsRow {
  dimensions?: { date?: string | null; datetimeHour?: string | null } | null;
  sum?: { requests?: number | null; errors?: number | null } | null;
}

/** "YYYY-MM-DD" for a Date, in UTC. */
export function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The UTC day a row belongs to, or null when the row carries no usable time. */
export function bucketDay(row: StatsRow): string | null {
  const raw = row.dimensions?.date ?? row.dimensions?.datetimeHour ?? null;
  if (typeof raw !== 'string') return null;
  const day = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/** The inclusive window of UTC days ending TODAY, oldest first. */
export function dayWindow(now: Date, days: number = STATS_DAYS): string[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    out.push(utcDay(new Date(end - i * 86_400_000)));
  }
  return out;
}

/** A count that is always a non-negative whole number, whatever came back. */
function count(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function total(days: StatsDay[]): StatsTotals {
  return days.reduce<StatsTotals>(
    (acc, d) => ({
      days: acc.days + 1,
      requests: acc.requests + d.requests,
      errors: acc.errors + d.errors,
    }),
    { days: 0, requests: 0, errors: 0 },
  );
}

/**
 * Turn Cloudflare's rows into the shape the tool renders.
 *
 * - Rows outside the window are dropped (Cloudflare may round a filter out).
 * - Several rows for the same day are ADDED together (that happens whenever
 *   the hourly fallback is used, and would also happen if a future query ever
 *   grouped by an extra dimension).
 * - Every day in the window is present, zero-filled, oldest first.
 */
export function shapeStats(
  rows: readonly StatsRow[],
  opts: { now: Date; scriptName: string; days?: number; fetchedAt?: Date },
): SiteStats {
  const days = opts.days ?? STATS_DAYS;
  const window = dayWindow(opts.now, days);
  const byDay = new Map<string, StatsDay>(
    window.map((date) => [date, { date, requests: 0, errors: 0 }]),
  );

  for (const row of rows ?? []) {
    const day = bucketDay(row);
    if (!day) continue;
    const slot = byDay.get(day);
    if (!slot) continue;
    slot.requests += count(row.sum?.requests);
    slot.errors += count(row.sum?.errors);
  }

  const ordered = window.map((date) => byDay.get(date) as StatsDay);

  return {
    ok: true,
    scriptName: opts.scriptName,
    since: window[0],
    until: window[window.length - 1],
    days: ordered,
    last7: total(ordered.slice(-STATS_SHORT_DAYS)),
    last28: total(ordered),
    fetchedAt: (opts.fetchedAt ?? opts.now).toISOString(),
  };
}

/**
 * Bar heights for the chart, as a fraction of the tallest day (0..1).
 * An all-zero window returns all zeros rather than dividing by zero, so a
 * brand-new site draws a flat baseline instead of a full-height wall.
 */
export function barFractions(days: readonly StatsDay[]): number[] {
  const peak = days.reduce((m, d) => (d.requests > m ? d.requests : m), 0);
  if (peak <= 0) return days.map(() => 0);
  return days.map((d) => d.requests / peak);
}
