// =============================================================================
// GET /preview/refresh-signal — the preview auto-refresh heartbeat
// =============================================================================
// The Presentation preview updates itself by POLLING this (see
// VisualEditingOverlay): it returns ONLY the newest draft-edit timestamp — no
// content — so the overlay can tell when something changed and re-fetch the
// page. We poll instead of listening for Sanity's "document mutated" comlink
// event because that event is deprecated and no longer fires in this Studio
// version (the manual Refresh button still works, which is what the overlay
// reuses). Studio-only concern; the value is a bare timestamp, nothing
// sensitive, and it never exposes draft content.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';

export const GET: APIRoute = async () => {
  const json = (rev: string) =>
    new Response(JSON.stringify({ rev }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });

  try {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: env.SANITY_TOKEN,
      // 'raw' so draft documents are visible by their `drafts.` id (the default
      // perspective would overlay/hide them and the timestamp would never move).
      perspective: 'raw',
    });
    const rev = await client.fetch<string | null>(
      '*[_id in path("drafts.**")] | order(_updatedAt desc)[0]._updatedAt',
    );
    return json(rev ?? '');
  } catch (err) {
    console.error('[refresh-signal] failed', err);
    return json('');
  }
};
