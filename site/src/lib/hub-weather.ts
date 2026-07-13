// =============================================================================
// Hub weather chip — current conditions at the school, with preschool copy
// =============================================================================
// Open-Meteo: free, keyless, generous limits. Fetched server-side for the hub
// greeting through the shared SWR cache (15 min fresh + 1h serve-stale), so
// it costs one request per window, never blocks a visitor inside the horizon,
// and simply returns null (chip hidden) on any failure. Coordinates are the
// school's — West Chester, OH.
// =============================================================================
import { cached } from '@/lib/hub-cache';

export interface HubWeather {
  tempF: number;
  icon: 'sun' | 'cloud-sun' | 'cloud-rain' | 'snowflake';
  line: string;
}

interface OpenMeteo {
  current?: { temperature_2m?: number; weather_code?: number };
}

/** WMO weather codes → chip icon + a playful line. */
function describe(tempF: number, code: number): Pick<HubWeather, 'icon' | 'line'> {
  if (code >= 71 && code <= 86 && code !== 80 && code !== 81 && code !== 82) {
    return { icon: 'snowflake', line: 'Snow-play kind of day!' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return { icon: 'cloud-rain', line: 'Splash-boot weather' };
  }
  const icon = code <= 1 ? 'sun' : 'cloud-sun';
  if (tempF >= 85) return { icon, line: 'Water-play hot!' };
  if (tempF >= 60) return { icon, line: 'Playground day!' };
  if (tempF >= 40) return { icon, line: 'Light-jacket day' };
  return { icon, line: 'Bundle-up cold!' };
}

/** Current weather at the school, or null (chip hidden) on any failure. */
export async function getWeather(): Promise<HubWeather | null> {
  try {
    return await cached(
      'weather:west-chester-oh',
      900_000,
      async () => {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=39.3362&longitude=-84.4052&current=temperature_2m,weather_code&temperature_unit=fahrenheit',
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error(`open-meteo ${res.status}`);
        const data = (await res.json()) as OpenMeteo;
        const tempF = Math.round(data.current?.temperature_2m ?? NaN);
        const code = data.current?.weather_code ?? 3;
        if (!Number.isFinite(tempF)) throw new Error('no temperature');
        return { tempF, ...describe(tempF, code) };
      },
      { swrMs: 3_600_000 },
    );
  } catch {
    return null;
  }
}
