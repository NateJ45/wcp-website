// =============================================================================
// Seasonal accent resolution — pure logic, unit-tested
// =============================================================================
// Site Settings has a "Seasonal touches" dropdown (auto / a season / off) that
// drives the small hand-drawn decorations in the public footer. This resolves
// that setting to a concrete season at BUILD time (the accents are static
// output; a rebuild refreshes "auto" as the calendar turns).
// =============================================================================

export type Season = 'fall' | 'winter' | 'spring' | 'summer';
export type SeasonSetting = Season | 'auto' | 'off';

/** Meteorological seasons — month is 1-12 (January = 1). */
export function seasonForMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Resolve the Site Settings value to a season to draw, or null for none.
 * Unknown/missing values behave like 'auto' so a half-migrated document
 * never blanks the footer. The date's month is read in Eastern time — the
 * school's wall clock — because a UTC build server flips months hours early.
 */
export function resolveSeason(setting: string | null | undefined, now: Date): Season | null {
  if (setting === 'off') return null;
  if (setting === 'fall' || setting === 'winter' || setting === 'spring' || setting === 'summer')
    return setting;
  const month = Number(
    now.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'numeric' }),
  );
  return seasonForMonth(month);
}
