// =============================================================================
// Tuition math — one source of truth for every price shown on the site
// =============================================================================
// The same numbers appear on the class cards, in the tuition calculator, and
// in the calculator's client script. They were drifting: the cards computed an
// annual total inline while the calculator only ever showed a monthly figure,
// and the one-time fees were briefly hardcoded in one place while Sanity held
// them in another. Pure functions here, imported everywhere, so a price can
// only be wrong in one place.
//
// Prices arrive from Sanity as DISPLAY STRINGS ("$150", "$45"), not numbers,
// which is why everything goes through parseMoney rather than Number().
// =============================================================================

/**
 * The school year runs September through May.
 *
 * This is what makes the annual figures derivable rather than stored: monthly x
 * 9 reproduces every total the school has published (70/630, 150/1350,
 * 200/1800, 175/1575). If the calendar ever changes, this is the one line.
 */
export const SCHOOL_YEAR_MONTHS = 9;

/**
 * "$1,350" -> 1350. Returns 0 for anything unparseable.
 *
 * Strips every non-numeric character, which also removes the invisible stega
 * marker characters Sanity injects into display strings in the /preview path
 * (see the stega gotcha in CLAUDE.md) — so this is safe on encoded values.
 */
export function parseMoney(value?: string | number | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** 1350 -> "$1,350". Whole dollars: the school does not price in cents. */
export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/** Tuition for the whole school year, before any fees. */
export function annualTuition(monthly: string | number | null | undefined): number {
  return parseMoney(monthly) * SCHOOL_YEAR_MONTHS;
}

export interface YearCostInput {
  /** Monthly tuition, summed if a family is enrolling in more than one class. */
  monthly: number;
  /** Per-child student fee, charged once for the year. */
  studentFee: number;
  /** One-time registration fee. Non-refundable. */
  registration: number;
  /** Participation deposit. Returned once co-op obligations are met. */
  deposit: number;
}

export interface YearCost {
  /** Tuition only, across the nine months. */
  tuition: number;
  /** Everything a family pays out across the first year. */
  total: number;
  /** The part of `total` that comes back: the participation deposit. */
  refundable: number;
  /** What the year actually costs once the deposit is returned. */
  net: number;
}

/**
 * The full first-year picture.
 *
 * `net` exists because the participation deposit is genuinely returned when a
 * family completes their co-op hours. Showing only the gross number overstates
 * the real cost of the year by the deposit, which is the opposite of the
 * "our tuition is public" promise.
 */
export function yearCost({ monthly, studentFee, registration, deposit }: YearCostInput): YearCost {
  const tuition = monthly * SCHOOL_YEAR_MONTHS;
  const total = tuition + studentFee + registration + deposit;
  return { tuition, total, refundable: deposit, net: total - deposit };
}
