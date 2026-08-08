// =============================================================================
// patch-menus-doctrine.mjs — sync the Sanity Menus doc to the code nav doctrine
// (dry-run by default; re-runnable whenever the doctrine in src/data/nav.ts moves)
// =============================================================================
// Writes the five-item funnel doctrine INTO the navigation singleton so the
// Studio doc matches the site. Mirrors src/data/nav.ts EXACTLY — if the
// doctrine changed there, update this script before running.
//
// HISTORY — the 2026-08-08 nav outage: the first version of this script wrote
// page links as literal `pageSlug` strings, a field the navLink schema doesn't
// have. The schema stores a `page` REFERENCE, and the NAVIGATION_QUERY resolves
// `"pageSlug": page->slug` from it — so every page link resolved null and the
// entire public nav rendered href="/". This version resolves each slug to the
// real page doc and writes proper references (and the site's resolveNavigation
// now warns at build time if a page link ever loses its reference again).
//
//   node scripts/patch-menus-doctrine.mjs            # dry run
//   node scripts/patch-menus-doctrine.mjs --commit
// =============================================================================
import { client, apply, done, COMMIT } from './patch-lib.mjs';

let k = 0;
const key = () => `nav${(k++).toString(36).padStart(3, '0')}`;
// `slug` is a placeholder resolved to a page reference below, after the
// slug → _id lookup — never written to the doc.
const page = (label, slug) => ({ _key: key(), _type: 'navLink', label, linkType: 'page', slug });
const url = (label, u) => ({ _key: key(), _type: 'navLink', label, linkType: 'url', url: u });
const group = (label, children) => ({ _key: key(), _type: 'navGroup', label, children });

// -----------------------------------------------------------------------------
// The doctrine (mirror of src/data/nav.ts, 2026-08-08). Routes with no page
// doc behind them (code-owned: /events, /colophon, /family-hub, the tour-form
// deep link) are url links — the navLink schema allows site-relative urls.
// -----------------------------------------------------------------------------
const mainNav = [
  group('Classes', [
    page('Twos Class', 'classes/twos'),
    page('Threes Class', 'classes/threes'),
    page('Pre-K Class', 'classes/pre-k'),
    page('A Day at WCP', 'a-day-at-wcp'),
  ]),
  group('Why WCP', [
    page('Why Families Choose Us', 'why-wcp'),
    page('Co-op Life', 'co-op-life'),
    page('Safety & Wellness', 'safety'),
    page('What Families Say', 'reviews'),
  ]),
  page('Tuition', 'tuition'),
  page('Visit', 'virtual-tour'),
  page('Enroll', 'enroll'),
];

const footerColumns = [
  {
    _key: key(),
    label: 'Classes',
    links: [
      page('Twos Class', 'classes/twos'),
      page('Threes Class', 'classes/threes'),
      page('Pre-K Class', 'classes/pre-k'),
      page('A Day at WCP', 'a-day-at-wcp'),
      page('Co-op Life', 'co-op-life'),
    ],
  },
  {
    _key: key(),
    label: 'About',
    links: [
      page('Why WCP?', 'why-wcp'),
      page('Safety & Wellness', 'safety'),
      page('What Families Say', 'reviews'),
      page('FAQ', 'faq'),
      // News stays deliberately unlinked (Nathan, 2026-07-19) — see the
      // comment in src/data/nav.ts. Restore with: url('News', '/news').
      url('Events', '/events'),
    ],
  },
  {
    _key: key(),
    label: 'Get Started',
    links: [
      page('Tuition & Fees', 'tuition'),
      url('Schedule a Tour', '/virtual-tour#sec-pp-tour-form'),
      page('Visit Us', 'virtual-tour'),
      page('Enroll', 'enroll'),
    ],
  },
  {
    _key: key(),
    label: 'Community',
    links: [
      url('Enrolled Families', '/family-hub'),
      page('Work With Us', 'work-with-us'),
      page('Donate', 'donate'),
      page('Newsletter', 'newsletter'),
      url('Store', 'https://store.westchesterpreschool.org'),
    ],
  },
];

const legalNav = [
  page('Accessibility', 'accessibility'),
  page('Privacy', 'privacy'),
  page('Terms of Use', 'terms'),
  url('Colophon', '/colophon'),
];

// -----------------------------------------------------------------------------
// Resolve slug placeholders → real page references. Fails loudly BEFORE
// writing anything if a slug has no page doc behind it.
// -----------------------------------------------------------------------------
const pages = await client.fetch(`*[_type == "page" && defined(slug)]{_id, slug}`);
const idBySlug = new Map(pages.map((p) => [p.slug, p._id]));

function resolveLink(link) {
  if (link.linkType !== 'page') return link;
  const { slug, ...rest } = link;
  const id = idBySlug.get(slug);
  if (!id) throw new Error(`no page doc with slug "${slug}" (link "${link.label}")`);
  return { ...rest, page: { _type: 'reference', _ref: id } };
}
const resolvedMain = mainNav.map((item) =>
  item._type === 'navGroup'
    ? { ...item, children: item.children.map(resolveLink) }
    : resolveLink(item),
);
const resolvedFooter = footerColumns.map((col) => ({ ...col, links: col.links.map(resolveLink) }));
const resolvedLegal = legalNav.map(resolveLink);

const existing = await client.fetch(`*[_type == "navigation"][0]{_id, "n": count(mainNav)}`);
if (!existing?._id) throw new Error('navigation singleton not found');
await apply(
  `overwrite navigation ${existing._id} (currently ${existing.n} top-level items) with the 5-item funnel doctrine (page links as REFERENCES)`,
  () =>
    client
      .patch(existing._id)
      .set({ mainNav: resolvedMain, footerColumns: resolvedFooter, legalNav: resolvedLegal })
      .commit(),
);
done(1);
if (COMMIT)
  console.log('Publish fires the deploy webhook — the fixed nav bakes into the next build.');
