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

/** Run a GROQ query with the gated server client. Pass `fresh: true` for
 *  read-after-write surfaces (e.g. the sign-ups page must show a family's
 *  own just-submitted response on reload — 60s of CDN staleness there would
 *  read as "my sign-up vanished"). */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  opts: { fresh?: boolean } = {},
): Promise<T> {
  return getSanityClient(opts).fetch<T>(query, params);
}
