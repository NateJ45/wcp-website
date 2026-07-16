// =============================================================================
// Hub weather-alert banner — the most urgent active NWS alert near the school
// =============================================================================
// api.weather.gov: free, keyless, but NWS policy requires an identifying
// User-Agent on every request (unidentified traffic risks throttling). Cached
// through the same window as hub-weather.ts (15min fresh, 1h stale-while-
// revalidate) — short on purpose, since a warning can be issued suddenly and
// families should see it catch up fast.
//
// Only surfaces alerts likely to matter for school operations. NWS's raw feed
// includes routine advisories (e.g. a Frost Advisory most fall mornings) that
// would make the banner cry wolf if shown unfiltered — so this keeps anything
// NWS itself flags Severe/Extreme, plus winter/ice/flood/extreme-temp events
// specifically (the categories that actually risk a delay or closure).
// "No relevant alert" is a normal, cacheable state — not a fetch failure.
// =============================================================================
import { cached } from '@/lib/hub-cache';

export interface HubAlert {
  headline: string;
  severity: string;
}

interface NwsAlertFeature {
  properties?: {
    event?: string;
    headline?: string;
    severity?: string;
  };
}
interface NwsAlerts {
  features?: NwsAlertFeature[];
}

const SCHOOL_RELEVANT =
  /winter|ice\s*storm|blizzard|tornado|flood|extreme (cold|heat)|excessive heat|wind chill/i;

/** The most urgent active NWS alert near the school, or null (banner hidden)
 *  when there's none or the fetch fails. */
export async function getActiveAlert(): Promise<HubAlert | null> {
  try {
    return await cached(
      'nws-alert:west-chester-oh',
      900_000,
      async () => {
        const res = await fetch('https://api.weather.gov/alerts/active?point=39.3362,-84.4052', {
          headers: { 'User-Agent': '(westchesterpreschool.org, wcp-website family hub)' },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`nws alerts ${res.status}`);
        const data = (await res.json()) as NwsAlerts;
        const features = Array.isArray(data.features) ? data.features : [];
        const relevant = features.find((f) => {
          const p = f.properties;
          if (!p) return false;
          if (p.severity === 'Severe' || p.severity === 'Extreme') return true;
          return SCHOOL_RELEVANT.test(p.event ?? '') || SCHOOL_RELEVANT.test(p.headline ?? '');
        });
        if (!relevant?.properties?.headline) return null;
        return {
          headline: relevant.properties.headline,
          severity: relevant.properties.severity ?? 'Moderate',
        };
      },
      { swrMs: 3_600_000 },
    );
  } catch {
    return null;
  }
}
