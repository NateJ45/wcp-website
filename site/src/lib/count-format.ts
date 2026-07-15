// ============================================================================
// count-format — the pure number → display-string step for the count-up effect
// ============================================================================
// Split out of src/scripts/countup.ts so the formatting is testable without a
// browser (Vitest can't drive requestAnimationFrame or the DOM). countup.ts
// calls this once per animation frame with the interpolated value, and the
// component sets prefix/suffix/decimals/group via data- attributes.
// ============================================================================

export interface CountFormat {
  /** Rendered before the number, e.g. "$". */
  prefix?: string;
  /** Rendered after the number, e.g. "%" or "+". */
  suffix?: string;
  /**
   * Fixed decimal places. Defaults to inferring from the value (integers → 0,
   * otherwise 1). A caller animating toward an INTEGER target must pass 0
   * explicitly, or interpolated mid-frames (e.g. 12.7 on the way to 34) would
   * flash a decimal the final value never has.
   */
  decimals?: number;
  /** Insert locale thousands separators (12500 → "12,500"). */
  group?: boolean;
}

/** Format one (possibly fractional, mid-animation) value for display. */
export function formatCount(value: number, fmt: CountFormat = {}): string {
  const { prefix = '', suffix = '', group = false } = fmt;
  const safe = Number.isFinite(value) ? value : 0;
  const decimals = fmt.decimals ?? (Number.isInteger(safe) ? 0 : 1);
  const body = group
    ? safe.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : safe.toFixed(decimals);
  return `${prefix}${body}${suffix}`;
}
