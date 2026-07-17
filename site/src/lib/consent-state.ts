// =============================================================================
// Consent state — the stored cookie-consent decision (pure logic, unit-tested)
// =============================================================================
// The optional-cookie inventory has TWO real categories (2026-07: Google
// Analytics is coming, Meta Pixel maybe):
//
//   analytics — Google Analytics 4 (PUBLIC_GA_ID, sets _ga cookies)
//   marketing — Google Ads conversion tag (PUBLIC_GADS_ID) + Meta Pixel
//               (PUBLIC_META_PIXEL_ID)
//
// Everything else is consent-exempt by design — the Cloudflare beacon is
// cookieless, video/map embeds are click-to-load on the nocookie host, and
// localStorage prefs (theme, hub sign-in) are essential. The stored decision
// is one grant/deny per category, versioned so a future inventory change can
// re-ask. DOM wiring: src/scripts/consent.ts.
//
// v1 (a single ads grant, never visible in production) is deliberately NOT
// migrated — parseConsent rejects it and the card re-asks, which is the
// correct behavior for a grown inventory.
// =============================================================================

export type ConsentValue = 'granted' | 'denied';

export const CONSENT_CATEGORIES = ['analytics', 'marketing'] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export interface ConsentState {
  /** Schema version. Bump ONLY when the cookie inventory changes in a way
      that invalidates an old answer (a new category) — a bump re-asks. */
  v: number;
  analytics: ConsentValue;
  marketing: ConsentValue;
  /** ISO timestamp of the decision, for the visitor's own reference. */
  at: string;
}

export const CONSENT_KEY = 'wcp-consent';
export const CONSENT_VERSION = 2;

/** Parse a stored decision. Returns null (= ask again) for anything invalid,
    from another schema version, or simply absent. */
export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const { v, analytics, marketing, at } = data as Record<string, unknown>;
    if (v !== CONSENT_VERSION) return null;
    if (analytics !== 'granted' && analytics !== 'denied') return null;
    if (marketing !== 'granted' && marketing !== 'denied') return null;
    return {
      v: CONSENT_VERSION,
      analytics,
      marketing,
      at: typeof at === 'string' ? at : '',
    };
  } catch {
    return null;
  }
}

/** Serialize a fresh decision for storage. */
export function serializeConsent(prefs: Record<ConsentCategory, ConsentValue>, now: Date): string {
  return JSON.stringify({
    v: CONSENT_VERSION,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    at: now.toISOString(),
  } satisfies ConsentState);
}

/** A Google tag id safe to interpolate into an injected script — covers the
    gtag.js family shapes ("G-ABC123XYZ" analytics, "AW-16817798038" ads). */
export function isValidGtagId(id: string): boolean {
  return /^[A-Za-z]{1,4}-[A-Za-z0-9]{4,20}$/.test(id);
}

/** A Meta Pixel id safe to interpolate (numeric, e.g. "1234567890123456"). */
export function isValidMetaPixelId(id: string): boolean {
  return /^\d{5,20}$/.test(id);
}
