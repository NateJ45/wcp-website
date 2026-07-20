import { defineMiddleware } from 'astro:middleware';
import { HUB_SESSION_KEY, isFamilyAuthed } from './lib/hub-auth';

// =============================================================================
// Family Hub gate
// =============================================================================
// (Board-managed redirects are applied at BUILD time via the `redirects` map
// in astro.config.mjs, which reads the `redirect` documents from Sanity — they
// emit real 301s through the Cloudflare adapter, same as the launch redirects.
// See docs/REDIRECTS.md. Nothing to do here.)
// =============================================================================
// Everything under /family-hub is for enrolled families only. A visitor must
// have signed in (shared password → session fingerprint) to see any of it;
// otherwise they are bounced to the sign-in page. The login page itself is the
// one public exception. The sign-in/out handlers live at /api/hub-* (outside
// this prefix, so they are never gated).
//
// Middleware only runs for on-demand (prerender=false) routes at request time.
// Every /family-hub page is prerender=false for exactly this reason — so the
// gate actually runs. Prerendered marketing pages skip this check (inHub=false)
// and never touch the session.
//
// THIS IS THE ONLY GATE. No hub page or endpoint does its own auth check, so
// every hub route depends on this file. Two consequences worth remembering:
//   - A new hub surface is protected the moment it lives under /family-hub and
//     sets prerender=false. Miss either and it is public.
//   - There is no defence in depth here. Do not add a bypass flag. This file
//     shipped with a `HUB_OPEN = true` preview switch that was never flipped
//     back, which left the family directory, the children's photo wall and the
//     health page open to the internet (found and closed 2026-07-19).
// =============================================================================

const HUB_PREFIX = '/family-hub';
const PUBLIC_HUB_PATHS = new Set(['/family-hub/login']);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';
  const inHub = path === HUB_PREFIX || path.startsWith(`${HUB_PREFIX}/`);
  // Server-island endpoints (/_server-islands/<Component>) render hub widgets
  // OUTSIDE the /family-hub prefix — every island on the site today is gated
  // hub content (the home dashboard's Google-backed widgets), so they take
  // the same check. Revisit if a PUBLIC page ever gains a server island.
  const isServerIsland = path.startsWith('/_server-islands/');

  if ((inHub || isServerIsland) && !PUBLIC_HUB_PATHS.has(path)) {
    // Imported lazily, inside the hub branch: `output: 'static'` means this
    // middleware also runs at BUILD time for prerendered marketing pages, and
    // those must never try to resolve a Worker-only virtual module.
    const { env } = await import('cloudflare:workers');
    const stored = await context.session?.get(HUB_SESSION_KEY);

    if (!(await isFamilyAuthed(stored, env.FAMILY_HUB_PASSWORD))) {
      // An island fetch can't follow a login redirect — just refuse it.
      if (isServerIsland) return new Response('Unauthorized', { status: 401 });
      // Remember where they were headed so we can return them after sign-in.
      const to = encodeURIComponent(context.url.pathname);
      return context.redirect(`/family-hub/login?to=${to}`);
    }
  }

  return next();
});
