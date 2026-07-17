import { defineMiddleware } from 'astro:middleware';

// =============================================================================
// Family Hub gate
// =============================================================================
// (Board-managed redirects are applied at BUILD time via the `redirects` map
// in astro.config.mjs, which reads the `redirect` documents from Sanity — they
// emit real 301s through the Cloudflare adapter, same as the launch redirects.
// See docs/REDIRECTS.md. Nothing to do here.)
// =============================================================================
// Everything under /family-hub is for enrolled families only. A visitor must
// have signed in (shared password → session flag) to see any of it; otherwise
// they are bounced to the sign-in page. The login page itself is the one
// public exception. The sign-in/out handlers live at /api/hub-* (outside this
// prefix, so they are never gated).
//
// Middleware only runs for on-demand (prerender=false) routes at request time.
// Every /family-hub page is prerender=false for exactly this reason — so the
// gate actually runs. Prerendered marketing pages skip this check (inHub=false)
// and never touch the session.
// =============================================================================

const HUB_PREFIX = '/family-hub';
const PUBLIC_HUB_PATHS = new Set(['/family-hub/login']);

// =============================================================================
// TEMPORARY — hub gate is OPEN for private preview.
// =============================================================================
// The site is not public yet and there is NO real family data in Sanity, so the
// hub is left ungated so it can be previewed without a password. Flip this back
// to `false` to re-enable the gate BEFORE the site goes public OR before ANY
// real family PII (the directory, health info) is entered in the Studio. This
// one line is the only thing to change; the gate logic below is untouched.
// =============================================================================
const HUB_OPEN = true;

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';

  // The embedded Sanity Studio (/studio, injected by @sanity/astro from
  // node_modules, prerender=false so this middleware DOES run for it) has no
  // page-level robots meta and must never be indexed. The sitemap filter
  // already excludes it; this header closes the indexing side. Editing the
  // injected route isn't durable, so the header lives here.
  if (path === '/studio' || path.startsWith('/studio/')) {
    const res = await next();
    res.headers.set('X-Robots-Tag', 'noindex');
    return res;
  }
  const inHub = path === HUB_PREFIX || path.startsWith(`${HUB_PREFIX}/`);
  // Server-island endpoints (/_server-islands/<Component>) render hub widgets
  // OUTSIDE the /family-hub prefix — every island on the site today is gated
  // hub content (the home dashboard's Google-backed widgets), so they take
  // the same check. Revisit if a PUBLIC page ever gains a server island.
  const isServerIsland = path.startsWith('/_server-islands/');

  if (!HUB_OPEN && (inHub || isServerIsland) && !PUBLIC_HUB_PATHS.has(path)) {
    const authed = await context.session?.get('familyAuthed');
    if (!authed) {
      // An island fetch can't follow a login redirect — just refuse it.
      if (isServerIsland) return new Response('Unauthorized', { status: 401 });
      // Remember where they were headed so we can return them after sign-in.
      const to = encodeURIComponent(context.url.pathname);
      return context.redirect(`/family-hub/login?to=${to}`);
    }
  }

  return next();
});
