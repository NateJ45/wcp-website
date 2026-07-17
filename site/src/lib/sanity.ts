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
 * behind-the-response.
 *
 * L1-ONLY (`kv: false`): this tier deliberately does NOT write through to the
 * CACHE KV namespace. The key set is large (a hubPage doc per page, per-page
 * supporting queries, the always-rendered topbar) and used on nearly every hub
 * view, so at KV cost it was the dominant consumer of the free ~1k-writes/day
 * budget (see the KV write-budget gotcha in CLAUDE.md). KV's only benefit is
 * sparing the first-visitor-after-recycle from a SLOW origin — but Sanity's
 * authenticated CDN (~100-300ms) is fast enough that a one-time first-touch
 * read per isolate is invisible, so the durability isn't worth a write. The L1
 * Map still absorbs repeat navigations within an isolate, and freshness is
 * unchanged (5 min); a publish also fires the deploy webhook (fresh isolate) so
 * edits never wait on this cache. Board content now costs ZERO KV writes.
 *
 * Still NEVER use for PII queries (directory entries, health details) — even
 * L1-only, family data shouldn't sit in a shared module cache; those reads pass
 * no `cache` at all. And never for read-after-write surfaces (sign-ups).
 */
export const BOARD_CONTENT_CACHE = { ttlMs: 300_000, swrMs: 1_800_000, kv: false };

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
  opts: { fresh?: boolean; cache?: { ttlMs: number; swrMs: number; kv?: boolean } } = {},
): Promise<T> {
  const run = () => getSanityClient(opts).fetch<T>(query, params);
  if (opts.cache && !opts.fresh) {
    const key = `groq:${query}:${JSON.stringify(params)}`;
    return cached(key, opts.cache.ttlMs, run, { swrMs: opts.cache.swrMs, kv: opts.cache.kv });
  }
  return run();
}
