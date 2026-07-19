// =============================================================================
// Hub air-quality chip — current AQI at the school, with preschool copy
// =============================================================================
// TWO SOURCES, in order of trust:
//
//   1. AirNow (EPA) — REAL GROUND MONITORS, the same data airnow.gov and the
//      phone weather apps show. Needs a free API key (AIRNOW_API_KEY, a Worker
//      secret). Optional: unset, everything still works on source 2.
//   2. Open-Meteo — the CAMS global FORECAST MODEL, keyless. Fallback only, and
//      never trusted on its own AQI number alone (see below).
//
// WHY (2026-07-19): this chip showed "AQI 61 · Decent air, fine for outside
// play" while EPA monitors in Cincinnati reported AQI 153, Unhealthy. The
// reading was NOT stale — Open-Meteo genuinely returned 61. A forecast model
// interpolated over a grid can miss a real particulate event, and it missed
// this one by ~90 points and two categories. On the same call it reported
// pm2_5 = 28.4 µg/m³, which by the EPA formula is already ~87: the model was
// inconsistent with its own particulates, because us_aqi uses a 24-hour average
// and lags a spike by most of a day. That is exactly the wrong direction to be
// wrong for an outdoor-play decision at a preschool.
//
// So the fallback path takes the MAX of the model's us_aqi and an AQI derived
// from its live pm2_5. That still under-reads a true monitor reading, but it
// reacts to a spike in hours rather than a day, and errs high rather than low.
// The scale math and the copy live in aqi-scale.ts, unit-tested.
//
// Cache window matches hub-weather.ts (8h fresh / 16h stale) because every
// refresh is a KV write against a near-capped free tier — see the KV
// write-budget gotcha in CLAUDE.md. ONLY THE RAW READING IS CACHED; icon and
// line are derived per request, so a copy fix is live on the next request
// instead of trapped in a KV envelope for 24h (that bit this same module
// before — see the "cache the raw reading" gotcha).
//
// US AQI only. Open-Meteo's pollen fields are Europe-only (CAMS European
// model), so real US pollen would need a different provider. See
// docs/FAMILY_HUB.md.
// =============================================================================
import { env } from 'cloudflare:workers';
import { cached } from '@/lib/hub-cache';
import { site } from '@/data/site';
import { aqiFromPm25, describeAqi, type AqiIcon } from '@/lib/aqi-scale';

export interface HubAirQuality {
  aqi: number;
  icon: AqiIcon;
  line: string;
  /** True when the number came from EPA ground monitors rather than the model. */
  observed: boolean;
}

interface OpenMeteoAQ {
  current?: { us_aqi?: number; pm2_5?: number };
}

/** One AirNow observation row (one per pollutant at the reporting area). */
interface AirNowObservation {
  ParameterName?: string;
  AQI?: number;
}

/**
 * EPA observations for the school's coordinates. The response carries one row
 * per pollutant (PM2.5, O3, ...) and the composite AQI is the WORST of them,
 * which is how the EPA defines the index.
 *
 * Returns null when the key is unset or anything goes wrong, so the caller
 * falls through to the model rather than the chip vanishing.
 */
async function fetchAirNow(): Promise<number | null> {
  const key = env.AIRNOW_API_KEY;
  if (!key) return null;
  try {
    const url =
      'https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json' +
      `&latitude=${site.geo.lat}&longitude=${site.geo.lng}&distance=50&API_KEY=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const rows = (await res.json()) as AirNowObservation[];
    const values = (Array.isArray(rows) ? rows : [])
      .map((r) => r.AQI)
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    return values.length > 0 ? Math.max(...values) : null;
  } catch {
    return null;
  }
}

/** Model fallback: max of the modelled AQI and the AQI implied by live PM2.5. */
async function fetchOpenMeteo(): Promise<number> {
  const res = await fetch(
    'https://air-quality-api.open-meteo.com/v1/air-quality' +
      `?latitude=${site.geo.lat}&longitude=${site.geo.lng}&current=us_aqi,pm2_5`,
    { signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) throw new Error(`open-meteo air quality ${res.status}`);
  const data = (await res.json()) as OpenMeteoAQ;
  const modelled = Math.round(data.current?.us_aqi ?? NaN);
  const fromPm25 = aqiFromPm25(data.current?.pm2_5 ?? NaN);
  const candidates = [modelled, fromPm25].filter(
    (n): n is number => n !== null && Number.isFinite(n),
  );
  if (candidates.length === 0) throw new Error('no aqi reading');
  return Math.max(...candidates);
}

/**
 * Current air quality at the school, or null (chip hidden) on any failure.
 *
 * The cache key encodes the SOURCE, so adding or removing AIRNOW_API_KEY moves
 * to a different key rather than reading a model number back out of a KV
 * envelope and labelling it observed. L2 KV survives the isolate recycle a
 * deploy causes, so a shared key would do exactly that.
 */
export async function getAirQuality(): Promise<HubAirQuality | null> {
  try {
    const observed = Boolean(env.AIRNOW_API_KEY);
    const aqi = await cached(
      // ":v2" — value shape changed (rendered object → raw number).
      // ":v3" — coordinates moved to site.geo (the school, not a point 2.2mi away).
      // ":v4" — reading comes from AirNow observations when a key is set, and
      //         the Open-Meteo path now takes max(us_aqi, aqiFromPm25) instead
      //         of trusting the model's own number.
      `air-quality:west-chester-oh:${observed ? 'airnow' : 'model'}:v4`,
      28_800_000, // 8h fresh — ~3 KV writes/day (see header)
      async () => (await fetchAirNow()) ?? (await fetchOpenMeteo()),
      { swrMs: 57_600_000 }, // +16h stale — 24h horizon, survives a quiet day
    );
    return { aqi, ...describeAqi(aqi), observed };
  } catch {
    return null;
  }
}
