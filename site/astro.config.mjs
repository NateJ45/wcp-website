// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// =============================================================================
// Astro config — West Chester Preschool
// =============================================================================
// FOUNDATION, edit with care. Mirrors the proven nixoncreativestudio setup.
//
// `output: 'static'` prerenders every public marketing page to plain HTML at
// build time (fast, cheap, great Lighthouse). The Cloudflare adapter stays
// installed so the gated Family Hub can opt individual routes into server
// rendering later with `export const prerender = false` — those SSR routes are
// where the family-hub password check and any Sanity PII reads will live.
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
    sitemap(),
    partytown({ config: { forward: ['dataLayer.push'] } }),
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
