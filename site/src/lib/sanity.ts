// =============================================================================
// Sanity read client — SERVER ONLY, behind the Family Hub gate
// =============================================================================
// The dataset is PRIVATE (it holds family PII). Reads use a token and only
// ever run inside gated, on-demand (prerender=false) hub routes. The token
// comes from the Worker env (`cloudflare:workers`), populated by .dev.vars in
// dev and a Cloudflare secret in prod. Do NOT import this from any
// prerendered/public page.
//
// `useCdn: true` = Sanity's AUTHENTICATED CDN (apicdn.sanity.io): requests
// still carry the token and unauthorized reads still fail — it is an access-
// controlled cache, not a public one. It shaves 100-300ms off every hub
// Sanity read and absorbs repeat queries at Sanity's edge, at the cost of
// up to ~60s staleness after a Studio publish. Acceptable for the hub; the
// write paths (form submissions, sign-ups) create their own client with
// useCdn:false because mutations must never route through a CDN host.
// =============================================================================
import { createClient, type SanityClient } from '@sanity/client';
import { env } from 'cloudflare:workers';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import { cached } from '@/lib/hub-cache';

/**
 * Cache tuning for BOARD-EDITED content (hubPage docs, Site Settings): fresh
 * for 5 minutes, then up to 30 minutes of serve-stale-instantly-and-refresh-
 * behind-the-response. Each refresh writes through to the CACHE KV namespace,
 * and this key set is large (a hubPage doc per page, plus settings), so a short
 * TTL under real traffic burns the free KV WRITE budget (1k/day) fast — 5 min
 * keeps it well clear while staying plenty fresh, since a publish also fires
 * the deploy webhook (fresh isolates) so edits never wait on this cache.
 * NEVER use for PII queries (directory entries, health details) — this path
 * writes through to KV, and family data doesn't belong in a second store. And
 * never for read-after-write surfaces (sign-ups).
 */
export const BOARD_CONTENT_CACHE = { ttlMs: 300_000, swrMs: 1_800_000 };

export function getSanityClient(opts: { fresh?: boolean } = {}): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: !opts.fresh,
    token: env.SANITY_TOKEN,
    perspective: 'published',
  });
}

/** Run a GROQ query with the gated server client.
 *  - `fresh: true` for read-after-write surfaces (e.g. the sign-ups page must
 *    show a family's own just-submitted response on reload — 60s of CDN
 *    staleness there would read as "my sign-up vanished").
 *  - `cache: BOARD_CONTENT_CACHE` for board-edited lookups repeated on every
 *    page view (hubPage docs, Site Settings): rides the hub-cache SWR tiers
 *    so repeat navigations skip the Sanity round-trip entirely. Mutually
 *    exclusive with `fresh` (fresh wins). Never for PII — see the const. */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  opts: { fresh?: boolean; cache?: { ttlMs: number; swrMs: number } } = {},
): Promise<T> {
  const run = () => getSanityClient(opts).fetch<T>(query, params);
  if (opts.cache && !opts.fresh) {
    const key = `groq:${query}:${JSON.stringify(params)}`;
    return cached(key, opts.cache.ttlMs, run, { swrMs: opts.cache.swrMs });
  }
  return run();
}
