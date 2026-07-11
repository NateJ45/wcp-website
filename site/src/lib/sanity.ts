// =============================================================================
// Sanity read client — SERVER ONLY, behind the Family Hub gate
// =============================================================================
// The dataset is PRIVATE (it holds family PII). Reads therefore use a token and
// never the public CDN (`useCdn: false`), and only ever run inside gated,
// on-demand (prerender=false) hub routes. The token comes from the Worker env
// (`cloudflare:workers`), populated by .dev.vars in dev and a Cloudflare secret
// in prod. Do NOT import this from any prerendered/public page.
// =============================================================================
import { createClient, type SanityClient } from '@sanity/client';
import { env } from 'cloudflare:workers';
import { projectId, dataset, apiVersion } from '@/sanity/env';

export function getSanityClient(): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: env.SANITY_TOKEN,
    perspective: 'published',
  });
}

/** Run a GROQ query with the gated server client. */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  return getSanityClient().fetch<T>(query, params);
}
