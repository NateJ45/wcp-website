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

export interface HubAirQuality {
  aqi: number;
  icon: 'leaf' | 'wind' | 'triangle-alert';
  line: string;
}

interface OpenMeteoAQ {
  current?: { us_aqi?: number };
}

/** EPA US AQI breakpoints → chip icon + a preschool-appropriate line. */
function describe(aqi: number): Pick<HubAirQuality, 'icon' | 'line'> {
  if (aqi <= 50) return { icon: 'leaf', line: 'Great air for outside play!' };
  if (aqi <= 100) return { icon: 'wind', line: 'Decent air, fine for outside play' };
  if (aqi <= 150) {
    return { icon: 'triangle-alert', line: 'Sensitive kiddos: shorter outdoor time' };
  }
  return { icon: 'triangle-alert', line: 'Indoor play day — air quality is poor' };
}

/** Current air quality at the school, or null (chip hidden) on any failure. */
export async function getAirQuality(): Promise<HubAirQuality | null> {
  try {
    return await cached(
      'air-quality:west-chester-oh',
      28_800_000, // 8h fresh — slow-moving reading, ~3 KV writes/day (see header)
      async () => {
        const res = await fetch(
          'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=39.3362&longitude=-84.4052&current=us_aqi',
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error(`open-meteo air quality ${res.status}`);
        const data = (await res.json()) as OpenMeteoAQ;
        const aqi = Math.round(data.current?.us_aqi ?? NaN);
        if (!Number.isFinite(aqi)) throw new Error('no aqi reading');
        return { aqi, ...describe(aqi) };
      },
      { swrMs: 57_600_000 }, // +16h stale — 24h horizon, survives a quiet day
    );
  } catch {
    return null;
  }
}
