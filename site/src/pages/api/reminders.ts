// =============================================================================
// GET /api/reminders — the board reminders feed (token-protected)
// =============================================================================
// Consumed by an Apps Script boardReminders() daily trigger (see docs/FORMS.md):
// it fetches this and, when there's anything, emails the board a short list.
// Sending from Apps Script (not a Worker cron) is deliberate — Workers can't
// send email on the free tier, and the Google side already holds the mailer,
// the token, and the recipient list (same pattern as /api/digest).
//
// Returns both "needs attention" items (banner left on, expired announcements,
// week-old unanswered messages, unpublished drafts) and "coming up" items
// (enrollment deadline, events, and sign-up sheets inside a two-week horizon).
// Requires ?token= to match FORMS_WEBHOOK_TOKEN; 404s when unset (feature off).
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sanityFetch } from '@/lib/sanity';
import { computeReminders, type ReminderState, type UpcomingItem } from '@/lib/reminders';

interface Snapshot {
  bannerOn: boolean;
  expiredAnnouncements: number;
  expiredSpotlights: number;
  oldUnanswered: number;
  drafts: number;
  enrollmentDeadline?: string | null;
  upcomingEvents: UpcomingItem[];
  closingSheets: UpcomingItem[];
}

const SNAPSHOT_QUERY = `{
  "bannerOn": count(*[_type == "closureAlert" && active == true]) > 0,
  "expiredAnnouncements": count(*[_type == "announcement" && enabled == true && defined(showUntil) && showUntil < now()]),
  "expiredSpotlights": count(*[_type == "hubSpotlight" && active == true && defined(showUntil) && showUntil < now()]),
  "oldUnanswered": count(*[_type == "submission" && handled != true && submittedAt < $weekAgo]),
  "drafts": count(*[_id in path("drafts.**") && _type in ["page","post","event","announcement","newsletterIssue"]]),
  "enrollmentDeadline": *[_type == "siteSettings"][0].enrollmentDeadline,
  "upcomingEvents": *[_type == "event" && coalesce(endDate, startDate) >= now()] | order(startDate asc)[0...20]{ title, "date": startDate },
  "closingSheets": *[_type == "signupSheet" && open == true && defined(eventDate) && eventDate >= $today] | order(eventDate asc){ title, "date": eventDate }
}`;

export const GET: APIRoute = async (context) => {
  const secret = env.FORMS_WEBHOOK_TOKEN;
  const given = context.url.searchParams.get('token') ?? '';
  if (!secret || given !== secret) {
    return new Response('Not found', { status: 404 });
  }

  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86_400_000).toISOString();
  const today = new Date(now).toISOString().slice(0, 10);

  let snap: Snapshot | null = null;
  try {
    snap = await sanityFetch<Snapshot>(SNAPSHOT_QUERY, { weekAgo, today });
  } catch (err) {
    console.error('[reminders] fetch failed', err);
    return new Response('Error', { status: 500 });
  }

  const state: ReminderState = {
    now,
    bannerOn: !!snap?.bannerOn,
    expiredAnnouncements: snap?.expiredAnnouncements ?? 0,
    expiredSpotlights: snap?.expiredSpotlights ?? 0,
    oldUnanswered: snap?.oldUnanswered ?? 0,
    drafts: snap?.drafts ?? 0,
    enrollmentDeadline: snap?.enrollmentDeadline ?? null,
    upcomingEvents: (snap?.upcomingEvents ?? []).filter((e) => e.title && e.date),
    closingSheets: (snap?.closingSheets ?? []).filter((s) => s.title && s.date),
  };

  const reminders = computeReminders(state);

  return new Response(JSON.stringify({ reminders }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
