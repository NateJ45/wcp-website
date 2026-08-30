// =============================================================================
// locations — the "Used on" panel, answered from the DATASET, not from memory
// =============================================================================
// Presentation's locations banner is what a volunteer trusts when they ask
// "where does this appear?" before they change or delete something. Until
// 2026-08-29 the reference types (staff / class / testimonial / faqItem) were
// HARDCODED to one page each, written when the site had different pages. The
// cost was measured during the teacher-replacement walkthrough: a staff member
// referenced by SEVEN documents showed "Used on one page", and that one link
// pointed at /preview/about — a page merged away on 2026-08-04, so the only
// lead the Studio offered was a 404.
//
// This resolver asks the dataset instead. For a document that IS a page
// (page / hubPage / post), the location is its own preview URL, same as
// before. For everything else it finds the pages that reference the document —
// directly, or THROUGH a class (a staff member reaches most pages as
// class->teacher, one hop removed, which `references()` alone cannot see).
//
// listenQuery keeps the panel live: add the teacher to another page and the
// list grows without a reload. Published perspective on purpose — the panel
// answers "where does this appear on the site?", and a draft-only placement
// appears nowhere yet.
// =============================================================================
import type { DocumentLocationResolver, DocumentLocationsState } from 'sanity/presentation';

type LocationsResult = ReturnType<DocumentLocationResolver>;

// NOT rxjs's `map` on purpose. This repo hoists rxjs 6 at the root (a
// transitive dependency of @lhci/cli), while sanity runs on its own rxjs 7 -
// so `import { map } from 'rxjs/operators'` hands a v6 operator to a v7
// Observable and the types (rightly) refuse. Mapping through the SOURCE's own
// constructor sidesteps the double install entirely: same Observable class in,
// same class out, no rxjs import from this package at all.
interface ObservableLike {
  subscribe(observer: {
    next: (value: unknown) => void;
    error?: (err: unknown) => void;
    complete?: () => void;
  }): { unsubscribe(): void };
}
function mapState<T>(source: unknown, fn: (value: T) => DocumentLocationsState): LocationsResult {
  const Ctor = (source as { constructor: new (s: (sub: never) => unknown) => unknown }).constructor;
  return new Ctor(
    (subscriber: {
      next: (v: DocumentLocationsState) => void;
      error: (e: unknown) => void;
      complete: () => void;
    }) => {
      const sub = (source as ObservableLike).subscribe({
        next: (value) => subscriber.next(fn(value as T)),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
      return () => sub.unsubscribe();
    },
  ) as LocationsResult;
}

/** Turn a page slug into its /preview href ("home" is the site root). */
export const previewHref = (slug?: string) => (slug === 'home' ? '/preview' : `/preview/${slug}`);

/** The one projection every branch returns rows in. */
const ROW = `{ "t": coalesce(title, heading, name), _type, "slug": slug, "hubKey": hubKey }`;

interface Row {
  t?: string;
  _type: string;
  slug?: string | { current?: string };
  hubKey?: string;
}

/** A row's preview URL, matching each type's real preview route. */
function hrefFor(row: Row): string | null {
  if (row._type === 'page') {
    return typeof row.slug === 'string' ? previewHref(row.slug) : null;
  }
  if (row._type === 'hubPage') {
    const key = row.hubKey || (typeof row.slug === 'string' ? row.slug : undefined);
    // The REAL hub route is the preview surface since 2026-08-30.
    return key ? (key === 'home' ? '/family-hub' : `/family-hub/${key}`) : null;
  }
  if (row._type === 'post') {
    const slug = typeof row.slug === 'object' ? row.slug?.current : row.slug;
    return slug ? `/preview/news/${slug}` : null;
  }
  return null;
}

// Self-locating types: the document IS the page.
const SELF = new Set(['page', 'hubPage', 'post']);

// Singletons whose home is fixed by code, not by references.
const FIXED: Record<string, { title: string; href: string }> = {
  siteSettings: { title: 'Site Settings (footer, contact info)', href: '/preview' },
  navigation: { title: 'Menus (header & footer)', href: '/preview' },
  feeSchedule: { title: 'Tuition & Fees', href: '/preview/tuition' },
  // Renders at the top of EVERY page while switched on; nothing references it,
  // so the usage query would call it "not shown anywhere" (seen live
  // 2026-08-29, on the doc of a banner showing on all 27 pages).
  closureAlert: { title: 'Every page (while switched on)', href: '/preview' },
};

// Locations a document ALWAYS has, whatever references it. The tuition table
// and calculator list EVERY class through a wildcard query, not a reference, so
// `references()` never sees them — yet every class appears on /tuition by
// construction. Without this a brand-new class reads "not shown on any page",
// which is wrong: it is already in the table. A staff member has no such
// guaranteed home (they appear only where a page picks them), so staff is not
// listed here.
const ALWAYS: Record<string, { title: string; href: string }[]> = {
  class: [{ title: 'Tuition & Fees (the table lists every class)', href: '/preview/tuition' }],
};

// One query, three arms. `direct` catches a page holding the reference itself
// (a Teachers section, a class-cards pick). `viaClass` catches the indirect
// path: pages render a teacher through class->teacher, and prices through the
// class doc, so a page referencing the CLASS is showing this document too.
// `ownPage` catches a class's own detail page, which references NOTHING about
// its class - the link is the slug convention classes/<slug>, matched on the
// same longest-prefix-with-"-"-sentinel rule the automatic menu uses (Pre-K
// AM and PM share classes/pre-k, which no exact match can see).
const USAGE_QUERY = `{
  "direct": *[_type in ["page", "hubPage", "post"] && !(_id in path("drafts.**")) && references($id)] ${ROW},
  "viaClass": *[_type in ["page", "hubPage"] && !(_id in path("drafts.**"))
    && references(*[_type == "class" && references($id)]._id)] ${ROW},
  "ownPage": *[_type == "class" && _id == $id][0]{
    "p": *[_type == "page" && !(_id in path("drafts.**")) && archived != true
      && string::startsWith("classes/" + ^.slug.current + "-", slug + "-")]
      | order(length(slug) desc)[0] ${ROW}
  }.p
}`;

const SELF_QUERY = `*[_id in [$id, "drafts." + $id]] | order(_updatedAt desc) [0] ${ROW}`;

export const locations: DocumentLocationResolver = ({ id, type }, { documentStore }) => {
  const publishedId = id.replace(/^drafts\./, '');

  if (FIXED[type]) return { locations: [FIXED[type]] };

  if (SELF.has(type)) {
    return mapState<Row | null>(
      documentStore.listenQuery(SELF_QUERY, { id: publishedId }, { perspective: 'raw' }),
      (row) => {
        const href = row ? hrefFor(row) : null;
        if (!href) {
          return {
            locations: [],
            message: 'Give this a web address (slug) to preview it.',
            tone: 'caution' as const,
          };
        }
        return { locations: [{ title: row?.t || 'Preview', href }] };
      },
    );
  }

  // Reference-carried content: staff, class, testimonial, faqItem, event,
  // and anything added later — the query does not care about the type.
  const always = ALWAYS[type] ?? [];

  return mapState<{ direct?: Row[]; viaClass?: Row[]; ownPage?: Row | null } | null>(
    documentStore.listenQuery(USAGE_QUERY, { id: publishedId }, { perspective: 'published' }),
    (result) => {
      const seen = new Set<string>();
      const rows: { title: string; href: string }[] = [];
      const own = result?.ownPage ? [result.ownPage] : [];
      for (const row of [
        ...own,
        ...always,
        ...(result?.direct ?? []),
        ...(result?.viaClass ?? []),
      ]) {
        // `always` rows are already {title, href}; queried rows carry a type.
        const href = 'href' in row ? row.href : hrefFor(row as Row);
        const title = 'title' in row ? row.title : (row as Row).t || href || '';
        if (!href || seen.has(href)) continue;
        seen.add(href);
        rows.push({ title, href });
      }
      if (!rows.length) {
        return {
          locations: [],
          message: 'Not shown on any page yet. It appears here once a page uses it.',
          tone: 'caution' as const,
        };
      }
      return { locations: rows };
    },
  );
};
