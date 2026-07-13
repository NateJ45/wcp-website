// =============================================================================
// GET /family-hub/api/search-index — everything the hub search can jump to
// =============================================================================
// Powers the Cmd/Ctrl+K palette (src/scripts/hub-search.ts): hub pages (from
// the same nav data the rail uses), updates, documents & forms, and open
// sign-up sheets, as one flat JSON list the client filters locally. Lives
// inside /family-hub so the middleware gate covers it. Sanity reads ride the
// board-content SWR cache — a 60s-stale search index is fine (deliberate
// exception to "collections live": this is a navigation aid, not a content
// surface; the pages it links to are always fresh).
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { sanityFetch, BOARD_CONTENT_CACHE } from '@/lib/sanity';
import { hubNav } from '@/data/hub-nav';

interface Entry {
  title: string;
  href: string;
  kind: 'page' | 'update' | 'document' | 'sign-up';
  sub?: string;
}

export const GET: APIRoute = async () => {
  const entries: Entry[] = [];

  for (const group of hubNav) {
    for (const link of group.links) {
      if (link.external) continue;
      entries.push({ title: link.label, href: link.href, kind: 'page', sub: group.label });
    }
  }

  try {
    const [updates, documents, sheets] = await Promise.all([
      sanityFetch<{ title?: string; slug?: string; date?: string }[]>(
        `*[_type == "update" && defined(slug.current)] | order(publishedAt desc)[0...100]{
          title, "slug": slug.current, "date": publishedAt
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
    ]);
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
        });
      }
    }
    for (const d of documents) {
      if (d.title && d.href) {
        entries.push({ title: d.title, href: d.href, kind: 'document', sub: 'Documents' });
      }
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
    headers: { 'content-type': 'application/json' },
  });
};
