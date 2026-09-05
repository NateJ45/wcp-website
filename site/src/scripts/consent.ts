// ============================================================================
// Cookie consent — card wiring + the consent-gated trackers, per category
// ============================================================================
// Two optional categories (see src/lib/consent-state.ts for the inventory):
//
//   analytics → Google Analytics 4 (data-ga-id)
//   marketing → Google Ads conversion tag (data-gads-id) + Meta Pixel
//               (data-meta-pixel-id)
//
// This script:
//   1. Shows the card (CookieConsent.astro, rendered `hidden`) on a first
//      visit — only when JS runs, because without JS no tracker can ever load
//      and a consent card would be pure noise.
//   2. Reads the toggle rows: "Save choices" stores exactly what's checked
//      (both default OFF, so an untouched Save IS the one-click decline the
//      equal-prominence rule wants); "Accept all" grants both.
//   3. Injects only the granted categories' scripts, all through Partytown
//      (type="text/partytown" + a `ptupdate` dispatch so its worker picks up
//      dynamically appended scripts). gtag ids share one gtag.js loader with
//      a config script per id; the Meta Pixel gets the standard fbq stub.
//   4. Un-hides the footer "Cookie choices" opener; reopening reflects the
//      stored decision in the toggles so a visitor can change one category
//      without re-deciding the other. A withdrawal takes effect from the
//      next page load (nothing new loads on the current one either way).
//
// Prerendered documents (Speculation Rules) defer all injection to
// `prerenderingchange` — a hidden prerender must never fire tracking.
// bfcache: a Back/Forward restore re-syncs card visibility on `pageshow`,
// so a decision made on another page hides the stale card here.
// ============================================================================
import { onPageLoad } from './_page-load';
import {
  CONSENT_KEY,
  parseConsent,
  serializeConsent,
  isValidGtagId,
  isValidMetaPixelId,
  type ConsentState,
  type ConsentValue,
} from '@/lib/consent-state';

const injectedGtagIds = new Set<string>();
let pixelInjected = false;

function addPartytownScript(setup: (s: HTMLScriptElement) => void): void {
  const script = document.createElement('script');
  script.type = 'text/partytown';
  setup(script);
  document.head.append(script);
}

/** One shared gtag.js loader; a config script per granted id. Safe to call
    again when a later category grant adds an id — only the new id injects. */
function ensureGtag(id: string): void {
  if (injectedGtagIds.has(id) || !isValidGtagId(id)) return;
  const first = injectedGtagIds.size === 0;
  injectedGtagIds.add(id);
  if (first) {
    addPartytownScript((s) => {
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    });
  }
  addPartytownScript((s) => {
    s.text = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${id}');`;
  });
  window.dispatchEvent(new CustomEvent('ptupdate'));
}

/** The standard fbq bootstrap, run inside Partytown. */
function ensureMetaPixel(id: string): void {
  if (pixelInjected || !isValidMetaPixelId(id)) return;
  pixelInjected = true;
  addPartytownScript((s) => {
    s.text =
      `!function(f,b,e,v,n,t){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};` +
      `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;` +
      `b.getElementsByTagName(e)[0].parentNode.insertBefore(t,b.getElementsByTagName(e)[0])}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
      `fbq('init', '${id}');fbq('track', 'PageView');`;
  });
  window.dispatchEvent(new CustomEvent('ptupdate'));
}

interface TrackerIds {
  gaId: string;
  gadsId: string;
  pixelId: string;
}

/** Load exactly what the decision grants (prerender-safe). */
function applyConsent(state: ConsentState, ids: TrackerIds): void {
  const inject = () => {
    if (state.analytics === 'granted' && ids.gaId) ensureGtag(ids.gaId);
    if (state.marketing === 'granted') {
      if (ids.gadsId) ensureGtag(ids.gadsId);
      if (ids.pixelId) ensureMetaPixel(ids.pixelId);
    }
  };
  const doc = document as Document & { prerendering?: boolean };
  if (doc.prerendering) {
    document.addEventListener('prerenderingchange', inject, { once: true });
  } else {
    inject();
  }
}

function stored() {
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null; // storage blocked → treat as undecided, never crash the page
  }
}

onPageLoad(() => {
  const card = document.querySelector<HTMLElement>('[data-consent-banner]');
  if (!card) return; // no tracker env vars in this build → nothing to consent to
  const ids: TrackerIds = {
    gaId: card.dataset.gaId ?? '',
    gadsId: card.dataset.gadsId ?? '',
    pixelId: card.dataset.metaPixelId ?? '',
  };
  const toggle = (cat: string) =>
    card.querySelector<HTMLInputElement>(`[data-consent-toggle="${cat}"]`);

  const decision = stored();
  if (decision) {
    applyConsent(decision, ids);
  } else {
    card.hidden = false;
  }

  const save = (analytics: ConsentValue, marketing: ConsentValue) => {
    const state: ConsentState = { v: 2, analytics, marketing, at: new Date().toISOString() };
    try {
      localStorage.setItem(CONSENT_KEY, serializeConsent(state, new Date()));
    } catch {
      /* storage blocked: the choice still applies for this page view */
    }
    card.hidden = true;
    applyConsent(state, ids);
  };

  card.querySelector<HTMLButtonElement>('[data-consent-save]')?.addEventListener('click', () => {
    save(
      toggle('analytics')?.checked ? 'granted' : 'denied',
      toggle('marketing')?.checked ? 'granted' : 'denied',
    );
  });
  card
    .querySelector<HTMLButtonElement>('[data-consent-accept-all]')
    ?.addEventListener('click', () => {
      const a = toggle('analytics');
      const m = toggle('marketing');
      if (a) a.checked = true;
      if (m) m.checked = true;
      save('granted', 'granted');
    });

  // Footer "Cookie choices": ships `hidden` (dead weight without JS), un-hidden
  // here; reopens the card with the toggles reflecting the stored decision so
  // one category can change without re-deciding the other.
  for (const opener of document.querySelectorAll<HTMLButtonElement>('[data-consent-open]')) {
    opener.hidden = false;
    opener.addEventListener('click', () => {
      const now = stored();
      const a = toggle('analytics');
      const m = toggle('marketing');
      if (a) a.checked = now?.analytics === 'granted';
      if (m) m.checked = now?.marketing === 'granted';
      card.hidden = false;
      card.querySelector<HTMLButtonElement>('[data-consent-save]')?.focus();
    });
  }

  // bfcache restore: if a decision was made on another page since this
  // document was frozen, drop the stale card (and honor any new grants).
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    const now = stored();
    if (now) {
      card.hidden = true;
      applyConsent(now, ids);
    }
  });
});

