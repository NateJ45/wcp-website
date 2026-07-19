// =============================================================================
// EPA AQI scale — pollutant concentration → US AQI, and AQI → preschool copy
// =============================================================================
// Pure math and copy, no network and no cache, so it unit-tests cleanly and can
// be shared by every air-quality source (AirNow observations, Open-Meteo model).
//
// WHY THIS EXISTS (2026-07-19): the hub showed "AQI 61 · Decent air, fine for
// outside play" while EPA ground monitors in Cincinnati reported AQI 153,
// Unhealthy. Open-Meteo's `us_aqi` comes from the CAMS global FORECAST MODEL,
// not from monitors, and it missed a real particulate event by ~90 points and
// two whole categories. Telling a preschool's families that an Unhealthy day is
// "fine for outside play" is the worst failure this chip can have, so the
// source now prefers observations and the derivation lives here where it can be
// pinned by tests.
//
// Breakpoints are the EPA 2024 revision (the PM2.5 Good ceiling moved 12.0 →
// 9.0 µg/m³). If EPA revises again, change the table and the tests together.
// =============================================================================

/** EPA PM2.5 breakpoints (2024): [Clow, Chigh, Ilow, Ihigh] in µg/m³ / AQI. */
const PM25_BREAKPOINTS: readonly (readonly [number, number, number, number])[] = [
  [0.0, 9.0, 0, 50],
  [9.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200],
  [125.5, 225.4, 201, 300],
  [225.5, 325.4, 301, 500],
];

/**
 * PM2.5 concentration (µg/m³) → US AQI, by the EPA's piecewise-linear formula.
 *
 * NOTE ON TIMEFRAMES: the official PM2.5 AQI uses a 24-HOUR average, so it lags
 * a spike badly. Feeding an instantaneous concentration in here deliberately
 * over-reads relative to the official number during a fast-rising event. That
 * is the safe direction to be wrong for an outdoor-play decision, and it is why
 * getAirQuality() takes the MAX of this and the modelled value rather than
 * trusting the model alone.
 *
 * Returns null for a non-finite or off-scale-high reading (the caller then has
 * nothing to claim, which is better than inventing a number).
 */
export function aqiFromPm25(ugm3: number): number | null {
  if (!Number.isFinite(ugm3) || ugm3 < 0) return null;
  for (const [cLow, cHigh, iLow, iHigh] of PM25_BREAKPOINTS) {
    if (ugm3 <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (ugm3 - cLow) + iLow);
    }
  }
  return 500; // beyond the table: the scale is capped at 500 "Hazardous"
}

export type AqiIcon = 'leaf' | 'wind' | 'triangle-alert';

/**
 * EPA US AQI breakpoints → chip icon + a preschool-appropriate line.
 *
 * The copy no longer ASSERTS safety in the two middle tiers. It used to say
 * "Decent air, fine for outside play" at 51-100, which is the sentence that
 * shipped over an Unhealthy day. A chip fed by a reading that can be wrong by
 * two categories should describe the number, not authorise a decision, so the
 * Moderate line now reports the tier and leaves the call to an adult.
 */
export function describeAqi(aqi: number): { icon: AqiIcon; line: string } {
  if (aqi <= 50) return { icon: 'leaf', line: 'Great air for outside play!' };
  if (aqi <= 100) return { icon: 'wind', line: 'Air is moderate today' };
  if (aqi <= 150) {
    return { icon: 'triangle-alert', line: 'Sensitive kiddos: shorter outdoor time' };
  }
  return { icon: 'triangle-alert', line: 'Indoor play day, air quality is poor' };
}
