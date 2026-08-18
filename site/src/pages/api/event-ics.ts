// =============================================================================
// GET /api/event-ics?id=<event _id> — the .ics download for one event
// =============================================================================
// The post-body event card links here so a family can save an event into any
// calendar app (Google gets its own template URL; this covers Apple/Outlook).
// Events are public data (the public /events page lists them), so this route
// is not gated. The query projects only display fields — no PII.
// =============================================================================
import type { APIRoute } from 'astro';
import { sanityFetch } from '@/lib/sanity';
import { buildIcs } from '@/lib/ics';
import type { EventDoc } from '@/lib/events';

export const prerender = false;

const EVENT_ICS_QUERY = `*[_type == "event" && _id == $id][0]{
  _id, title, startDate, endDate, allDay, location, description,
  "venue": venue->{ name, address, note }
}`;

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id') ?? '';
  if (!id) return new Response('Missing id', { status: 400 });

  const event = await sanityFetch<EventDoc | null>(EVENT_ICS_QUERY, { id });
  if (!event?.title || !event.startDate) return new Response('Not found', { status: 404 });

  const filename =
    event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event';

  return new Response(buildIcs(event), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.ics"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
};
