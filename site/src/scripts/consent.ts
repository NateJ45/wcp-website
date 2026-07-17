// ============================================================================
// Cookie consent — banner wiring + the consent-gated Google Ads tag
// ============================================================================
// The ONE optional cookie on this site is the Google Ads conversion tag
// (see src/lib/consent-state.ts for the inventory reasoning). This script:
//
//   1. Shows the banner (CookieConsent.astro, rendered `hidden`) on a first
//      visit — only when JS runs, because without JS no tag can ever load and
//      a consent banner would be pure noise.
//   2. Persists the visitor's choice in localStorage (versioned).
//   3. Injects the gtag scripts ONLY after a grant — through Partytown
//      (type="text/partytown" + a `ptupdate` dispatch so its worker picks up
//      dynamically appended scripts), same off-main-thread setup the tag had
//      when Analytics.astro loaded it unconditionally.
//   4. Un-hides the footer "Cookie choices" button so a decision can be
//      changed later (a deny takes effect from the next page load; nothing
//      new loads on the current one either way).
//
// Prerendered documents (Speculation Rules) defer the tag injection to
// `prerenderingchange` — a hidden prerender must never fire ad tracking.
// bfcache: a Back/Forward restore re-syncs banner visibility on `pageshow`,
// so a decision made on another page hides the stale banner here.
// ============================================================================
import { onPageLoad } from './_page-load';
import { CONSENT_KEY, parseConsent, serializeConsent, isValidAdsId } from '@/lib/consent-state';

let tagLoaded = false;

function loadAdsTag(gadsId: string): void {
  if (tagLoaded || !isValidAdsId(gadsId)) return;
  tagLoaded = true;

  const inject = () => {
    const loader = document.createElement('script');
    loader.type = 'text/partytown';
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${gadsId}`;

    const config = document.createElement('script');
    config.type = 'text/partytown';
    config.text = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gadsId}');`;

    document.head.append(loader, config);
    // Partytown scans text/partytown scripts once at init; dynamically added
    // ones need this nudge (harmless if the scan hasn't happened yet).
    window.dispatchEvent(new CustomEvent('ptupdate'));
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
  const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
  if (!banner) return; // no PUBLIC_GADS_ID in this build → nothing to consent to
  const gadsId = banner.dataset.gadsId ?? '';

  const decision = stored();
  if (!decision) banner.hidden = false;
  if (decision?.ads === 'granted') loadAdsTag(gadsId);

  const decide = (ads: 'granted' | 'denied') => {
    try {
      localStorage.setItem(CONSENT_KEY, serializeConsent(ads, new Date()));
    } catch {
      /* storage blocked: the choice still applies for this page view */
    }
    banner.hidden = true;
    if (ads === 'granted') loadAdsTag(gadsId);
  };

  banner
    .querySelector<HTMLButtonElement>('[data-consent-allow]')
    ?.addEventListener('click', () => decide('granted'));
  banner
    .querySelector<HTMLButtonElement>('[data-consent-deny]')
    ?.addEventListener('click', () => decide('denied'));

  // Footer "Cookie choices": ships `hidden` (dead weight without JS), un-hidden
  // here; reopens the banner so a past decision can be changed.
  for (const opener of document.querySelectorAll<HTMLButtonElement>('[data-consent-open]')) {
    opener.hidden = false;
    opener.addEventListener('click', () => {
      banner.hidden = false;
      banner.querySelector<HTMLButtonElement>('[data-consent-allow]')?.focus();
    });
  }

  // bfcache restore: if a decision was made on another page since this
  // document was frozen, drop the stale banner (and honor a new grant).
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    const now = stored();
    if (now) {
      banner.hidden = true;
      if (now.ads === 'granted') loadAdsTag(gadsId);
    }
  });
});

export {};
