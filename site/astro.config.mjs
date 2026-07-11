// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import tailwindcss from '@tailwindcss/vite';

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
//   - partytown : runs Google Ads gtag.js in a web worker, off the main
//                 thread, so third-party tracking never drags down the
//                 Performance score. `forward: ['dataLayer.push']` proxies
//                 gtag() calls from the main thread into the worker.
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
  // off Squarespace. Add one line per old path when the domain is cut over
  // (get the old URL list from the current site's sitemap). These emit real
  // 301s via the Cloudflare adapter. See docs/REDIRECTS.md.
  redirects: {
    // Friendly aliases (safe regardless of the old site):
    '/blog': '/news',
    '/calendar': '/events',
    // Old Squarespace paths go here, e.g.:
    // '/our-classes': '/classes/twos',
    // '/about-us': '/about',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
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
    sitemap(),
    partytown({ config: { forward: ['dataLayer.push'] } }),
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
