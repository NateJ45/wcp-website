// =============================================================================
// Hub weather — current conditions + 7-day forecast, with preschool copy
// =============================================================================
// Open-Meteo: free, keyless, generous limits. Fetched server-side through the
// shared SWR cache, so each read costs one request per fresh window, never
// blocks a visitor inside the horizon, and simply returns an empty result
// (chip/widget hidden) on any failure. Coordinates are the school's — West
// Chester, OH.
//
// getWeather() — current conditions for the hub greeting chip (15min fresh,
//   1h stale-while-revalidate).
// getWeekAheadForecast() — the next 7 days for the "Week ahead" dashboard
//   widget, flagging days that need a coat (low <= 45°F) or rain gear
//   (>=50% precip chance) — a multi-day forecast doesn't shift minute to
//   minute, so this rides a longer 3h fresh / 6h stale window to keep KV
//   writes low (see the KV write-budget gotcha in CLAUDE.md).
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

// =============================================================================
// 7-day forecast — "what should we send them in tomorrow" planning
// =============================================================================
export interface HubForecastDay {
  dateISO: string;
  /** "Today" for the first entry, otherwise a short weekday ("Mon"). */
  dayLabel: string;
  high: number;
  low: number;
  icon: HubWeather['icon'] | 'cloud-sun';
  line: string;
  /** Low temp at/below 45°F — pack a warm coat. */
  needsCoat: boolean;
  /** Max precipitation chance at/above 50% — pack rain/mud gear. */
  needsRainGear: boolean;
}

interface OpenMeteoForecast {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

// Date-only ISO strings anchor to noon UTC before timezone-formatting — see
// the CLAUDE.md gotcha (midnight UTC formats as the PREVIOUS day in Eastern).
const dayName = (dateISO: string): string =>
  new Date(`${dateISO}T12:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  });

/** The next 7 days at the school (today included), or [] on any failure. */
export async function getWeekAheadForecast(): Promise<HubForecastDay[]> {
  try {
    return await cached(
      'weather:west-chester-oh:week',
      10_800_000, // 3h fresh — a multi-day forecast doesn't need 15min freshness
      async () => {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=39.3362&longitude=-84.4052' +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
            '&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=7',
          { signal: AbortSignal.timeout(5000) },
        );
        if (!res.ok) throw new Error(`open-meteo forecast ${res.status}`);
        const daily = ((await res.json()) as OpenMeteoForecast).daily;
        const dates = daily?.time ?? [];
        if (dates.length === 0) throw new Error('no forecast days');
        const days: HubForecastDay[] = [];
        for (let i = 0; i < dates.length; i++) {
          const dateISO = dates[i];
          const high = Math.round(daily?.temperature_2m_max?.[i] ?? NaN);
          const low = Math.round(daily?.temperature_2m_min?.[i] ?? NaN);
          if (!Number.isFinite(high) || !Number.isFinite(low)) continue;
          const code = daily?.weather_code?.[i] ?? 3;
          const precip = daily?.precipitation_probability_max?.[i] ?? 0;
          days.push({
            dateISO,
            dayLabel: i === 0 ? 'Today' : dayName(dateISO),
            high,
            low,
            ...describe(high, code),
            needsCoat: low <= 45,
            needsRainGear: precip >= 50,
          });
        }
        return days;
      },
      { swrMs: 21_600_000 }, // 6h stale-while-revalidate — keeps KV writes low
    );
  } catch {
    return [];
  }
}
