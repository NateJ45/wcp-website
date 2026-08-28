// =============================================================================
// GET /family-hub/api/search-index — everything the hub search can jump to
// =============================================================================
// Powers the Cmd/Ctrl+K palette (src/scripts/hub-search.ts): hub pages (from
// the same nav data the rail uses), the WORDS INSIDE those pages (one entry per
// page-builder section, incl. image alt text — see lib/hub-search-index.ts),
// updates with their body text, documents & forms, and open sign-up sheets, as
// one flat JSON list the client filters locally. Lives inside /family-hub so
// the middleware gate covers it. Sanity reads ride the board-content SWR cache
// — a 60s-stale search index is fine (deliberate exception to "collections
// live": this is a navigation aid, not a content surface; the pages it links to
// are always fresh).
//
// THE DIRECTORY IS NOT INDEXED. Family names, emails, and phone numbers are
// PII, which never gets cached (see the KV/caching rules in CLAUDE.md) — and
// this response is cached both in the board cache and by the browser. The
// health page IS indexed: that doc is Board-written policy, not per-child
// records.
//
// CACHING: the index is now ~10x its old size, and the site runs WITHOUT
// ClientRouter, so every navigation is a fresh document and the script's
// module-level promise cache dies with it. Without a Cache-Control header the
// browser would re-download the whole index on the first ⌘K of every page.
// `private` because this is gated content — shared caches must not hold it.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { sanityFetch, BOARD_CONTENT_CACHE } from '@/lib/sanity';
import { isUsableHubSlug } from '@/lib/hub-pages';
import { hubNav } from '@/data/hub-nav';
import { getCalendarEvents, eventDate } from '@/lib/hub-calendar';
import { calendarFeedUrlFallback } from '@/data/hub/live-links';
import {
  HUB_PAGE_DENY,
  hubPageRoute,
  hubRoutesFromNav,
  pageEntries,
  sectionText,
  type SearchEntry,
} from '@/lib/hub-search-index';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface HubPageRow {
  hubKey?: string;
  slug?: string;
  title?: string;
  heading?: string;
  sections?: any[];
}

export const GET: APIRoute = async () => {
  const entries: SearchEntry[] = [];

  for (const group of hubNav) {
    for (const link of group.links) {
      if (link.external) continue;
      entries.push({ title: link.label, href: link.href, kind: 'page', sub: group.label });
    }
  }

  try {
    const [pages, updates, documents, sheets, guides, supplies] = await Promise.all([
      // EVERY hub page except the denied ones, so a page the Board gains later
      // indexes itself instead of waiting for someone to remember a registry.
      // hubPageRoute() below still has the final say on where each one links.
      sanityFetch<HubPageRow[]>(
        // `archived != true`: an archived page is off the hub, so it must not
        // come back through search. Pages made before the field stay indexed.
        `*[_type == "hubPage" && !(hubKey in $denied) && archived != true]{ hubKey, slug, title, heading, sections }`,
        { denied: [...HUB_PAGE_DENY] },
        { cache: BOARD_CONTENT_CACHE },
      ),
      sanityFetch<{ title?: string; slug?: string; date?: string; body?: any }[]>(
        `*[_type == "update" && defined(slug.current)] | order(publishedAt desc)[0...100]{
          title, "slug": slug.current, "date": publishedAt, body
        }`,
        {},
        { cache: BOARD_CONTENT_CACHE },
      ),
      sanityFetch<{ title?: string; href?: string }[]>(
        `*[_type == "hubDocument" && (defined(link) || defined(file.asset))]{
          title, "href": select(sourceType == "file" => file.asset->url, link)
        }`,
        {},
        { cache: BOARD_CONTENT_CACHE },
      ),
      sanityFetch<{ title?: string }[]>(
        `*[_type == "signupSheet" && open == true]{ title }`,
        {},
        { cache: BOARD_CONTENT_CACHE },
      ),
      // The generated PDFs, findable by their Studio titles.
      sanityFetch<{ cls?: string; title?: string }[]>(
        `*[_type == "curriculumGuide"]{ "cls": class, title }`,
        {},
        { cache: BOARD_CONTENT_CACHE },
      ),
      sanityFetch<{ year?: string } | null>(
        `*[_type == "supplyList"][0]{ year }`,
        {},
        { cache: BOARD_CONTENT_CACHE },
      ),
    ]);

    // The branded PDFs (public static assets, regenerated each deploy). Titles
    // come from the Studio documents; the committed names are the fallback, so
    // the entries exist even before the documents do.
    const PDF_NAMES: Record<string, string> = {
      twos: 'Twos Curriculum Guide',
      threes: 'Threes Curriculum Guide',
      'pre-k': 'Pre-K Curriculum Guide',
    };
    for (const [cls, file] of [
      ['twos', 'twos-curriculum.pdf'],
      ['threes', 'threes-curriculum.pdf'],
      ['pre-k', 'pre-k-curriculum.pdf'],
    ] as const) {
      const title = guides.find((g) => g.cls === cls)?.title || PDF_NAMES[cls];
      entries.push({ title, href: `/curriculum/${file}`, kind: 'document', sub: 'PDF' });
    }
    entries.push({
      title: `School Supply List${supplies?.year ? ` (${supplies.year})` : ''}`,
      href: '/supplies/supply-list.pdf',
      kind: 'document',
      sub: 'PDF',
    });

    const knownRoutes = hubRoutesFromNav(hubNav);
    for (const page of pages) {
      // Two kinds of hub page. A BUILT-IN one resolves its hubKey to a route;
      // a BOARD-CREATED one is served by the catch-all at its own slug. Both
      // index the same way, so a page the Board adds in ten years is findable
      // in the palette the day they publish it, with no registry to update.
      let href: string | null = null;
      if (page.hubKey) {
        // Null when the doc has no page to land on — a deleted route, or a doc
        // created before its page exists. Better silent than hits that go
        // nowhere.
        href = hubPageRoute(page.hubKey, knownRoutes);
      } else if (isUsableHubSlug(page.slug)) {
        href = `/family-hub/${page.slug!.trim()}`;
      }
      if (!href) continue;
      entries.push(...pageEntries(href, page.heading ?? page.title ?? 'Family Hub', page.sections));
    }

    for (const u of updates) {
      if (u.title && u.slug) {
        entries.push({
          title: u.title,
          href: `/family-hub/updates/${u.slug}`,
          kind: 'update',
          sub: u.date
            ? new Date(u.date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
                timeZone: 'America/New_York',
              })
            : undefined,
          text: u.body ? sectionText({ body: u.body }, 800) : undefined,
        });
      }
    }
    for (const d of documents) {
      if (d.title && d.href) {
        entries.push({ title: d.title, href: d.href, kind: 'document', sub: 'Documents' });
      }
    }

    // Calendar events. Parents search for the thing by NAME ("playdate",
    // "picnic", "conferences") far more often than they search for the word
    // "calendar" — and before this, "playdate" returned nothing while three
    // summer playdates sat on the schedule. Events come from the Apps Script
    // feed, not Sanity, so they need their own read; it rides the same 12h
    // cache the Calendar page uses, so this costs no extra Google round-trip.
    // Failures are swallowed separately: a dead feed must not take the whole
    // index down with it.
    try {
      const feedUrl =
        (
          await sanityFetch<{ calendarFeedUrl?: string } | null>(
            `*[_type == "hubSettings"][0]{ calendarFeedUrl }`,
            {},
            { cache: BOARD_CONTENT_CACHE },
          )
        )?.calendarFeedUrl || calendarFeedUrlFallback;
      if (feedUrl) {
        for (const ev of await getCalendarEvents(feedUrl)) {
          if (!ev.title) continue;
          entries.push({
            title: ev.title,
            href: '/family-hub/calendar',
            kind: 'event',
            sub: eventDate(ev.start).toLocaleDateString('en-US', {
              timeZone: 'America/New_York',
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            // Location/description are what make an event findable by more
            // than its exact name ("Symmes Playground", "wear old shoes").
            text: [ev.location, ev.description].filter(Boolean).join(' ') || undefined,
          });
        }
      }
    } catch (err) {
      console.error('[search-index] calendar feed failed', err);
    }
    for (const s of sheets) {
      if (s.title) {
        entries.push({ title: s.title, href: '/family-hub/sign-ups', kind: 'sign-up' });
      }
    }
  } catch (err) {
    console.error('[search-index] sanity reads failed', err);
    // The static page list above still ships — search degrades, never breaks.
  }

  return new Response(JSON.stringify(entries), {
    headers: {
      'content-type': 'application/json',
      // 5 min: long enough that ⌘K is instant while clicking around the hub,
      // short enough that a Board edit surfaces in search about as fast as it
      // surfaces on the pages themselves (the 60s board cache + a rebuild).
      'cache-control': 'private, max-age=300',
    },
  });
};
