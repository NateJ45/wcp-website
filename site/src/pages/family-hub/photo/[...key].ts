import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

/**
 * Serve a family photograph from R2.
 *
 * WHY THIS ROUTE EXISTS AT ALL
 *
 * Family photos used to be Sanity image assets. Sanity's CDN serves those to
 * anyone holding the URL, with no gate: the URL is an unguessable hash, which is
 * obscurity rather than access control, and it never expires. These are
 * photographs of children, so on 2026-09-06 they moved to R2, which has no
 * public endpoint. This route is the only way to them.
 *
 * It lives UNDER /family-hub deliberately. That prefix is what
 * src/middleware.ts gates, so the request has already been checked before this
 * file runs — the protection is not something this handler could forget to do.
 * Moving this route elsewhere would silently unprotect every photo.
 */
export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });
  if (!env.FAMILY_PHOTOS) return new Response('Not configured', { status: 404 });

  const object = await env.FAMILY_PHOTOS.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      // PRIVATE, not public: a shared cache must never hold a family's photo
      // where the next visitor could be served it. `private` still lets the
      // signed-in family's own browser cache it, which is the point.
      'Cache-Control': 'private, max-age=3600',
      // A photo is not a document; refuse to let one be sniffed into markup.
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
