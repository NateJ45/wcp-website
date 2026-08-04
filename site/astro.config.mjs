// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import tailwindcss from '@tailwindcss/vite';

// -----------------------------------------------------------------------------
// Board-managed redirects (read from Sanity at build time)
// -----------------------------------------------------------------------------
// The board adds `redirect` documents in the Studio when they rename or remove
// a page; we fold them into the same `redirects` map as the launch-migration
// ones below, so they emit real 301s via the Cloudflare adapter. Publishing a
// redirect fires the deploy webhook (redirect isn't in the webhook's excluded
// types), so it takes effect on the next rebuild like any other content edit.
// FULLY fail-safe: any error (no token, Sanity down, bad data) → no CMS
// redirects, and the build still succeeds with the static launch redirects.
async function fetchCmsRedirects() {
  const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
  const token = process.env.SANITY_TOKEN || env.SANITY_TOKEN;
  if (!token) return {};
  try {
    const query = '*[_type == "redirect" && defined(from) && defined(to)]{from,to,permanent}';
    const url = `https://niemhgev.apicdn.sanity.io/v2025-01-01/data/query/production?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return {};
    const { result } = await res.json();
    /** @type {Record<string, string | { status: number, destination: string }>} */
    const map = {};
    for (const r of result || []) {
      if (!r.from || !r.to || r.from === r.to) continue;
      map[r.from] =
        r.permanent === false
          ? { status: 302, destination: r.to }
          : { status: 301, destination: r.to };
    }
    return map;
  } catch {
    return {};
  }
}
const cmsRedirects = await fetchCmsRedirects();

// =============================================================================
// Astro config — West Chester Preschool
// =============================================================================
// FOUNDATION, edit with care. Mirrors the proven nixoncreativestudio setup.
//
// `output: 'static'` prerenders every public marketing page to plain HTML at
// build time (fast, cheap, great Lighthouse). The Cloudflare adapter also
// renders the gated Family Hub, where every route opts into server rendering
// with `export const prerender = false` (see src/middleware.ts) — those SSR
// routes are where the family-hub password check and any Sanity PII reads
// live, confirmed working in production.
//
// Deploy target is a Cloudflare WORKER with a static-assets binding (see
// wrangler.jsonc), NOT Cloudflare Pages. `npm run deploy` runs the build then
// `wrangler deploy`.
//
// Integrations:
//   - sitemap   : emits sitemap-index.xml + sitemap-0.xml at build time
//   - partytown : runs the consent-gated trackers (gtag.js, Meta Pixel) in a
//                 web worker, off the main thread, so third-party tracking
//                 never drags down the Performance score. `forward` proxies
//                 main-thread gtag()/fbq() calls (e.g. a future conversion
//                 event on a form submit) into the worker. Injection itself
//                 happens post-consent in src/scripts/consent.ts.
//   - react     : enables React islands (used for interactive bits like the
//                 FAQ accordion, testimonial effects, and the family map)
//
// Tailwind 4 wires in via the Vite plugin (not the old @astrojs/tailwind
// integration). All brand tokens live in src/styles/globals.css via @theme —
// there is no tailwind.config file.
// =============================================================================
export default defineConfig({
  // Canonical production URL. Sitemap + Open Graph tags read from it.
  // TODO(nathan): confirm apex vs www before launch (DNS decision).
  site: 'https://www.westchesterpreschool.org',
  output: 'static',

  // Redirects — old URLs → new, so links and search rankings survive the move
  // off Squarespace. These emit real 301s via the Cloudflare adapter. See
  // docs/REDIRECTS.md.
  redirects: {
    // Old Squarespace paths that CHANGED (pulled from the old sitemap.xml,
    // 2026-07). Same-named pages (/about, /tuition, /faq, /contact, /enroll,
    // /donate, /newsletter, /work-with-us, /why-wcp, /a-day-at-wcp) resolve
    // directly on the new site and need no redirect.
    '/home': '/',
    // 2026-08-04 page merges: /contact folded into the Visit Us page and
    // /about into Why WCP? (the docs are deleted). Sanity also holds matching
    // Board-editable redirect docs; these static entries keep the 301s alive
    // even in a build where the CMS redirect read fails.
    '/contact': '/virtual-tour',
    '/about': '/why-wcp',
    '/twos-class': '/classes/twos',
    '/threes-class': '/classes/threes',
    '/pre-k-class': '/classes/pre-k',
    '/coop-life': '/co-op-life',
    '/tour': '/virtual-tour',
    // The old family hub. On Squarespace these were top-level pages behind a
    // shared password ("/families" was the landing; the dashboards sat at the
    // root, e.g. "/blog", "/coop-jobs"). They map 1:1 onto the new gated hub,
    // which re-prompts for the password. `/blog` and `/calendar` were the hub's
    // meeting blog and calendar (NOT a public blog/events page), so they point
    // into the hub, not at /news or /events.
    '/families': '/family-hub',
    '/blog': '/family-hub/updates',
    '/calendar': '/family-hub/calendar',
    '/coop-jobs': '/family-hub/coop-jobs',
    '/documents': '/family-hub/documents',
    '/directory': '/family-hub/directory',
    '/fundraising': '/family-hub/fundraising',
    '/health': '/family-hub/health',
    '/tuition-payments': '/family-hub/tuition',
    '/twos-classroom': '/family-hub/twos',
    '/threes-classroom': '/family-hub/threes',
    '/pre-k-am-classroom': '/family-hub/pre-k-am',
    '/pre-k-pm-classroom': '/family-hub/pre-k-pm',

    // Board-managed redirects from the Studio (see fetchCmsRedirects above).
    // Spread LAST so a board entry wins over a stale launch one for the same
    // path — the board can correct a launch redirect without a code change.
    ...cmsRedirects,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  // Family Hub sign-in persistence.
  //
  // Astro's default session cookie carries no maxAge, which makes it a
  // BROWSER-SESSION cookie: it dies when the family fully closes their browser,
  // so "sign in once" would really mean "sign in constantly". A long maxAge
  // fixes that. 400 days is the ceiling modern browsers will honour (Chrome
  // caps cookie lifetime there), so in practice this reads as "until something
  // ends it".
  //
  // What ends it is the password, not a timer. The session stores a fingerprint
  // derived from FAMILY_HUB_PASSWORD (see src/lib/hub-auth.ts), and the
  // middleware re-derives and compares it on every hub request, so rotating the
  // secret signs everyone out on their next page view. `ttl` is deliberately
  // left unset (default: never expires server-side) — the fingerprint is the
  // expiry mechanism, and a server-side TTL would only add a second, invisible
  // one that logs families out for no reason they can see.
  //
  // `secure` is deliberately NOT set here so Astro keeps its
  // secure-in-production default; hardcoding it would stop the cookie being set
  // over http://localhost and break the gate locally.
  session: {
    cookie: {
      maxAge: 60 * 60 * 24 * 400,
      // Astro sets `secure: true` whenever the build is production, which is
      // right for the deployed site (always HTTPS) but breaks the hub test
      // suites: `astro preview` serves that same production build over plain
      // http://localhost, and WebKit REFUSES to send a Secure cookie over http.
      // Chromium has a localhost exception, so the symptom was only the
      // webkit-iphone project failing to sign in while chromium passed.
      //
      // The Playwright hub config sets this var for its webServer (build +
      // preview) so the suites can authenticate. NEVER set it for a real
      // deploy — it would ship the family session cookie without the Secure
      // flag.
      ...(process.env.WCP_INSECURE_COOKIES === '1' ? { secure: false } : {}),
    },
  },

  // imageService: 'compile' optimizes <Image /> with Sharp at BUILD time into
  // static dist/_astro/*.webp, so no runtime Cloudflare Images binding is
  // needed. (Learned from NCS: the adapter's default runtime image service
  // leaves images broken in production on a static site.)
  adapter: cloudflare({ imageService: 'compile' }),

  integrations: [
    // Sanity: mounts the embedded Studio at /studio and exposes the client.
    // projectId/dataset are public (bundled into the Studio); the read token is
    // a server-only secret used elsewhere (see src/lib/sanity.ts). Studio auth
    // is Sanity's own login, separate from the family gate.
    sanity({
      projectId: 'niemhgev',
      dataset: 'production',
      useCdn: false,
      studioBasePath: '/studio',
    }),
    sitemap({
      // Keep non-content URLs out of the index: the gated hub and the Studio
      // (SSR shells — mostly excluded already because the sitemap only walks
      // prerendered routes, but the filter makes it explicit and future-proof),
      // plus the search / thank-you utility pages and the 404. `page` is the
      // full URL; static directory output means paths end in "/", so strip it
      // before comparing.
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '') || '/';
        if (path === '/family-hub' || path.startsWith('/family-hub/')) return false;
        if (path === '/studio' || path.startsWith('/studio/')) return false;
        return !['/search', '/thank-you', '/404'].includes(path);
      },
      // Every deploy is a full rebuild (content publishes trigger one via the
      // Sanity webhook), so the build moment is an honest lastmod for every
      // entry — crawlers get a real freshness signal instead of none.
      lastmod: new Date(),
    }),
    partytown({ config: { forward: ['dataLayer.push', 'fbq'] } }),
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
    // @sanity/ui (pulled in by the Help & Guide center's GuideView component)
    // ships an ESM build that rolldown/Vite's dependency pre-bundler mis-scans
    // on this machine (MISSING_EXPORT errors for styled-components — a known
    // issue on this Astro 7 + Cloudflare + Vite 7 stack, see project notes on
    // the /studio-in-dev path-with-spaces bug). Excluding it from pre-bundling
    // lets Vite dev start; it's still fully bundled correctly at `astro build`.
    optimizeDeps: {
      exclude: ['@sanity/ui', 'styled-components'],
    },
  },
});
