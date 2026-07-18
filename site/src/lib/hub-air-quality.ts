// =============================================================================
// Hub air-quality chip — current AQI at the school, with preschool copy
// =============================================================================
// Open-Meteo Air Quality API: free, keyless, same provider/coords/cache window
// as hub-weather.ts (8h fresh / 16h stale — AQI drifts slowly and every refresh
// is a KV write against a near-capped free tier; see hub-weather's header and
// the KV write-budget gotcha in CLAUDE.md). US AQI only — the pollen fields are
// Europe-only
// (CAMS European model), so real US pollen would need a different provider
// (e.g. Google's Pollen API, which needs a billed API key); left out on
// purpose to keep this a zero-setup addition. See docs/FAMILY_HUB.md.
// =============================================================================
import { cached } from '@/lib/hub-cache';
import { site } from '@/data/site';

export interface HubAirQuality {
  aqi: number;
  icon: 'leaf' | 'wind' | 'triangle-alert';
  line: string;
}

interface OpenMeteoAQ {
  current?: { us_aqi?: number };
}

/**
 * EPA US AQI breakpoints → chip icon + a preschool-appropriate line.
 * Exported for unit tests: the tier boundaries are the whole contract here, and
 * getting 51 wrong once already shipped "Good" copy over a Moderate reading.
 */
export function describeAqi(aqi: number): Pick<HubAirQuality, 'icon' | 'line'> {
  if (aqi <= 50) return { icon: 'leaf', line: 'Great air for outside play!' };
  if (aqi <= 100) return { icon: 'wind', line: 'Decent air, fine for outside play' };
  if (aqi <= 150) {
    return { icon: 'triangle-alert', line: 'Sensitive kiddos: shorter outdoor time' };
  }
  return { icon: 'triangle-alert', line: 'Indoor play day — air quality is poor' };
}

/**
 * Current air quality at the school, or null (chip hidden) on any failure.
 *
 * ONLY THE RAW READING IS CACHED — the icon and line are derived per request.
 * Caching the rendered object instead meant a copy fix stayed invisible for up
 * to the full 24h horizon: KV (L2) survives the isolate recycle a deploy
 * causes, so the first visitor after shipping read the PRE-FIX envelope back
 * out and the hub kept showing the old wording against a newer number. Derive
 * presentation strings at read time and a copy edit is live on the next
 * request, cache or no cache.
 */
export async function getAirQuality(): Promise<HubAirQuality | null> {
  try {
    const aqi = await cached(
      // ":v2" — the cached value changed shape (rendered object → raw number).
      // A new key abandons the old envelopes rather than reading one back as a
      // number and rendering "AQI [object Object]"; they expire on their own.
      // ":v3" — the coordinates moved to site.geo (the school, not a point 2.2
      // miles away), so the stored reading is for the old location.
      'air-quality:west-chester-oh:v3',
      28_800_000, // 8h fresh — slow-moving reading, ~3 KV writes/day (see header)
      async () => {
        const res = await fetch(
          'https://air-quality-api.open-meteo.com/v1/air-quality' +
            `?latitude=${site.geo.lat}&longitude=${site.geo.lng}&current=us_aqi`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error(`open-meteo air quality ${res.status}`);
        const data = (await res.json()) as OpenMeteoAQ;
        const reading = Math.round(data.current?.us_aqi ?? NaN);
        if (!Number.isFinite(reading)) throw new Error('no aqi reading');
        return reading;
      },
      { swrMs: 57_600_000 }, // +16h stale — 24h horizon, survives a quiet day
    );
    return { aqi, ...describeAqi(aqi) };
  } catch {
    return null;
  }
}
