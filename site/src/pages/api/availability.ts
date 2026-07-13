// =============================================================================
// GET /api/availability — live class-availability badges (public)
// =============================================================================
// The public class cards are STATIC, but "2 spots left" must not wait for a
// rebuild, so the cards hydrate from this SSR route instead. It reads the
// enrollment chair's Google Sheet (Site Settings → availability Sheet ID)
// server-side through the shared gviz reader and returns a tiny JSON list.
// Cached for 5 minutes so a burst of visitors costs one Sheets fetch, and a
// sheet edit still shows up within minutes. Empty list on any failure or when
// no sheet is configured — the badges simply stay hidden (progressive
// enhancement; see src/scripts/availability.ts).
//
// No PII here (it's the public site's data), but the Sanity read still uses
// the gated runtime client because that's the only client available in the
// Worker at request time.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { sanityFetch, BOARD_CONTENT_CACHE } from '@/lib/sanity';
import { getAvailability } from '@/lib/gsheets';
import { SITE_SETTINGS_AVAILABILITY_SHEET_QUERY } from '@/lib/queries';

export const GET: APIRoute = async () => {
  let items: unknown[] = [];
  try {
    const sheetId = await sanityFetch<string | null>(
      SITE_SETTINGS_AVAILABILITY_SHEET_QUERY,
      {},
      {
        cache: BOARD_CONTENT_CACHE,
      },
    );
    if (sheetId) items = await getAvailability(sheetId);
  } catch (err) {
    console.error('[availability] fetch failed', err);
  }
  return new Response(JSON.stringify(items), {
    headers: {
      'content-type': 'application/json',
      // Browser-side SWR too: repeat visitors get instant badges from their
      // HTTP cache while the browser refetches in the background.
      'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
};
