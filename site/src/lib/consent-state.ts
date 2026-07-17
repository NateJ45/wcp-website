// =============================================================================
// Consent state — the stored cookie-consent decision (pure logic, unit-tested)
// =============================================================================
// The public site sets exactly ONE optional cookie: the Google Ads conversion
// tag (PUBLIC_GADS_ID). Everything else is consent-exempt by design — the
// Cloudflare beacon is cookieless, video/map embeds are click-to-load on the
// nocookie host, and localStorage prefs (theme, hub sign-in) are essential.
// So the stored decision is a single grant/deny for the ads tag, versioned in
// case the inventory ever grows categories. DOM wiring: src/scripts/consent.ts.
// =============================================================================

export type ConsentValue = 'granted' | 'denied';

export interface ConsentState {
  /** Schema version. Bump ONLY when the cookie inventory changes in a way
      that invalidates an old answer (a new category) — a bump re-asks. */
  v: number;
  ads: ConsentValue;
  /** ISO timestamp of the decision, for the visitor's own reference. */
  at: string;
}

export const CONSENT_KEY = 'wcp-consent';
export const CONSENT_VERSION = 1;

/** Parse a stored decision. Returns null (= ask again) for anything invalid,
    from another schema version, or simply absent. */
export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const { v, ads, at } = data as Record<string, unknown>;
    if (v !== CONSENT_VERSION) return null;
    if (ads !== 'granted' && ads !== 'denied') return null;
    return { v: CONSENT_VERSION, ads, at: typeof at === 'string' ? at : '' };
  } catch {
    return null;
  }
}

/** Serialize a fresh decision for storage. */
export function serializeConsent(ads: ConsentValue, now: Date): string {
  return JSON.stringify({ v: CONSENT_VERSION, ads, at: now.toISOString() } satisfies ConsentState);
}

/** A Google Ads tag id safe to interpolate into an injected script
    ("AW-16817798038" shape; guards against a malformed env value). */
export function isValidAdsId(id: string): boolean {
  return /^[A-Za-z]{1,4}-[A-Za-z0-9]{4,20}$/.test(id);
}
