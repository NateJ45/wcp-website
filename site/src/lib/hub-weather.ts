// =============================================================================
// Hub weather — current conditions + 7-day forecast, with preschool copy
// =============================================================================
// Open-Meteo: free, keyless, generous limits. Fetched server-side through the
// shared SWR cache, so each read costs one request per fresh window, never
// blocks a visitor inside the horizon, and simply returns an empty result
// (chip/widget hidden) on any failure. Coordinates are the school's — West
// Chester, OH.
//
// One fetch, ONE cache key: getWeather derives from getWeekAheadForecast's
// day 0, so the greeting ribbon and the Week-ahead strip always agree and
// there's only a single KV-writing key for both. It rides a LONG cache window
// (8h fresh / 16h stale) on purpose: this is an ambient "is it a playground
// day" signal, not a live instrument, and every cache refresh writes through to
// the CACHE KV namespace, whose free tier is ~1k writes/day account-wide and
// already near the ceiling (see the KV write-budget gotcha in CLAUDE.md). 8h
// fresh = ~3 writes/day instead of ~96 at the old 15min. Crucially the ribbon
// shows the DAY'S HIGH, not an instantaneous "right now" temperature — a
// forecast high for today doesn't drift through the day, so the 8h cache can't
// make it look wrong (an instantaneous reading would go stale by afternoon).
//
// getWeather() — today's high/low, condition, rain chance, UV + pack flags for
//   the hub greeting ribbon.
// getWeekAheadForecast() — the next 7 days for the "Week ahead" dashboard
//   widget: per day an icon + one-word label, high/low, rain chance, peak UV,
//   and coat (low <= 45°F) / rain-gear (>=50% precip) / sunscreen (UV >= 6)
//   flags. All from ONE Open-Meteo daily call (no extra fetch or KV key).
// =============================================================================
import { cached } from '@/lib/hub-cache';
import { site } from '@/data/site';

/** The weather icons this module can return (all live in lucide-icons.ts). */
export type WeatherIcon =
  'sun' | 'cloud-sun' | 'cloud' | 'cloud-rain' | 'cloud-lightning' | 'cloud-fog' | 'snowflake';

export interface HubWeather {
  /** The day's forecast HIGH (not an instantaneous reading — see header). */
  high: number;
  low: number;
  icon: WeatherIcon;
  /** One-word condition ("Sunny", "Rain", "Snow") for compact tiles. */
  label: string;
  /** Warm preschool-voice sentence for the greeting ribbon / screen readers. */
  line: string;
  /** Max chance of precipitation for the day, 0-100. */
  precipChance: number;
  /** Peak EPA UV index for the day (0-11+). */
  uvMax: number;
  /** Low temp at/below 45°F — pack a warm coat. */
  needsCoat: boolean;
  /** Precip chance at/above 50% — pack rain/mud gear. */
  needsRainGear: boolean;
  /** UV index at/above 6 (EPA "high") — hats and sunscreen. */
  needsSunscreen: boolean;
}

interface Condition {
  icon: WeatherIcon;
  label: string;
  line: string;
}

/**
 * WMO weather code (+ the day's high, for the temperature flavour on dry days)
 * → an icon, a one-word condition label for the forecast tiles, and a warm
 * preschool-voice line for the greeting ribbon and screen readers. Covers the
 * full WMO table so snow / ice / thunder / fog each read distinctly rather than
 * all collapsing to "rain".
 */
function describe(tempF: number, code: number): Condition {
  // Thunderstorms (95, 96, 99).
  if (code >= 95) {
    return { icon: 'cloud-lightning', label: 'Storms', line: 'Thunderstorms, an indoor-play day' };
  }
  // Freezing rain / freezing drizzle — the ice risk (56, 57, 66, 67).
  if (code === 56 || code === 57 || code === 66 || code === 67) {
    return { icon: 'snowflake', label: 'Icy', line: 'Icy mix, take extra care at drop-off' };
  }
  // Snow, snow grains, snow showers (71-77, 85, 86).
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { icon: 'snowflake', label: 'Snow', line: 'Snow-play day! Bundle up warm' };
  }
  // Heavy rain / violent showers (65, 82).
  if (code === 65 || code === 82) {
    return { icon: 'cloud-rain', label: 'Rain', line: 'Rain gear day, coats and boots' };
  }
  // Drizzle, rain, showers (51-63, 80, 81).
  if ((code >= 51 && code <= 63) || code === 80 || code === 81) {
    return { icon: 'cloud-rain', label: 'Showers', line: 'Splash boots handy, showers around' };
  }
  // Fog (45, 48).
  if (code === 45 || code === 48) {
    return { icon: 'cloud-fog', label: 'Fog', line: 'Foggy start, take it slow at drop-off' };
  }
  // Dry: icon + label by cloud cover, the line by temperature.
  const dry: Pick<Condition, 'icon' | 'label'> =
    code === 3
      ? { icon: 'cloud', label: 'Cloudy' }
      : code === 2
        ? { icon: 'cloud-sun', label: 'Partly' }
        : { icon: 'sun', label: 'Sunny' };
  const line =
    tempF >= 90
      ? 'Water-play hot! Sunscreen and water bottles'
      : tempF >= 80
        ? 'Warm and bright, hats on'
        : tempF >= 60
          ? 'Playground perfect!'
          : tempF >= 45
            ? 'Light-jacket day'
            : tempF >= 32
              ? 'Chilly, bundle up'
              : 'Freezing, bundle up tight';
  return { ...dry, line };
}

/**
 * Today's weather for the hub greeting ribbon: the day's HIGH/LOW, condition,
 * rain chance, and pack flags. Derived from getWeekAheadForecast's day 0, so it
 * shares that one cached fetch (no separate API call or KV key) and can never
 * disagree with the Week-ahead strip. The temperature is the forecast HIGH, not
 * an instantaneous reading — see the header for why that matters with the 8h
 * cache. Null (ribbon hidden) when the forecast is unavailable; the underlying
 * getWeekAheadForecast already swallows any failure and returns [].
 */
export async function getWeather(): Promise<HubWeather | null> {
  const today = (await getWeekAheadForecast())[0];
  if (!today) return null;
  const {
    high,
    low,
    icon,
    label,
    line,
    precipChance,
    uvMax,
    needsCoat,
    needsRainGear,
    needsSunscreen,
  } = today;
  return {
    high,
    low,
    icon,
    label,
    line,
    precipChance,
    uvMax,
    needsCoat,
    needsRainGear,
    needsSunscreen,
  };
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
  icon: WeatherIcon;
  /** One-word condition ("Sunny", "Rain", "Snow", ...) for the tile. */
  label: string;
  line: string;
  /** Max chance of precipitation for the day, 0-100 (rounded). */
  precipChance: number;
  /** Peak EPA UV index for the day (0-11+, rounded). */
  uvMax: number;
  /** Low temp at/below 45°F — pack a warm coat. */
  needsCoat: boolean;
  /** Precip chance at/above 50% — pack rain/mud gear. */
  needsRainGear: boolean;
  /** UV index at/above 6 (EPA "high") — hats and sunscreen. */
  needsSunscreen: boolean;
}

interface OpenMeteoForecast {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    uv_index_max?: number[];
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
      // ":v3" — the day shape gained `label`/`precipChance` (v2) then `uvMax`/
      // `needsSunscreen` (v3). Bump the key on any shape change so a deploy
      // fetches the new fields fresh instead of serving the old-shape envelope
      // for up to the 8h fresh window. ":v4" — the coordinates moved to
      // site.geo (the school, not a point 2.2 miles away).
      'weather:west-chester-oh:week:v4',
      28_800_000, // 8h fresh — a multi-day forecast barely moves; ~3 KV writes/day
      async () => {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${site.geo.lat}&longitude=${site.geo.lng}` +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max' +
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
          const precip = Math.round(daily?.precipitation_probability_max?.[i] ?? 0);
          const uv = Math.round(daily?.uv_index_max?.[i] ?? 0);
          days.push({
            dateISO,
            dayLabel: i === 0 ? 'Today' : dayName(dateISO),
            high,
            low,
            ...describe(high, code),
            precipChance: precip,
            uvMax: uv,
            needsCoat: low <= 45,
            needsRainGear: precip >= 50,
            needsSunscreen: uv >= 6,
          });
        }
        return days;
      },
      { swrMs: 57_600_000 }, // +16h stale — 24h horizon, survives a quiet day
    );
  } catch {
    return [];
  }
}
