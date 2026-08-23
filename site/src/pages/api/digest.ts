// =============================================================================
// GET /api/digest — the weekly family-digest feed (token-protected)
// =============================================================================
// Consumed by the Apps Script weeklyDigest() function (see
// scripts/apps-script/forms-inbox.gs): a weekly clock trigger on the school's
// Google account fetches this, formats it, and emails the families list.
// Sending from Apps Script (not a Worker cron) is deliberate — Workers can't
// send email on the free tier, and the Google side already holds the mailer,
// the token, and the recipient list.
//
// Returns the last 7 days of hub announcements (skipping meeting minutes) and
// the next 14 days of calendar events. Requires ?token= to match
// FORMS_WEBHOOK_TOKEN so the gated hub's announcement titles aren't readable
// by arbitrary strangers. 404s when the token is unset (feature off).
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sanityFetch } from '@/lib/sanity';
import { getUpcomingEvents, eventDate, fmtEventTime, type HubEvent } from '@/lib/hub-calendar';

interface UpdateDoc {
  title?: string;
  excerpt?: string;
  slug?: string;
  publishedAt?: string;
  category?: string;
}

export const GET: APIRoute = async (context) => {
  const secret = env.FORMS_WEBHOOK_TOKEN;
  const given = context.url.searchParams.get('token') ?? '';
  if (!secret || given !== secret) {
    return new Response('Not found', { status: 404 });
  }

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  let announcements: UpdateDoc[] = [];
  try {
    announcements = await sanityFetch<UpdateDoc[]>(
      `*[_type == "update" && defined(publishedAt) && publishedAt >= $since && category != "minutes"]
        | order(publishedAt desc)[0...10]{ title, excerpt, "slug": slug.current, publishedAt, category }`,
      { since },
    );
  } catch (err) {
    console.error('[digest] updates fetch failed', err);
  }

  let events: { title: string; when: string; location?: string }[] = [];
  try {
    const feedUrl = await sanityFetch<string | null>(
      `*[_type == "hubSettings"][0].calendarFeedUrl`,
    );
    if (feedUrl) {
      const horizon = Date.now() + 14 * 86_400_000;
      events = (await getUpcomingEvents(feedUrl))
        .filter((e: HubEvent) => eventDate(e.start).getTime() <= horizon)
        .slice(0, 12)
        .map((e: HubEvent) => ({
          title: e.title,
          when: `${eventDate(e.start).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: 'America/New_York',
          })} · ${fmtEventTime(e)}`,
          location: e.location || undefined,
        }));
    }
  } catch (err) {
    console.error('[digest] events fetch failed', err);
  }

  return new Response(
    JSON.stringify({
      announcements: announcements.map((a) => ({
        title: a.title ?? '',
        excerpt: a.excerpt ?? '',
        url: a.slug ? `https://www.westchesterpreschool.org/family-hub/updates/${a.slug}` : '',
      })),
      events,
    }),
    { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
  );
};
