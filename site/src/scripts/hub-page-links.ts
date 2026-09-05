// ============================================================================
// hub-page-links — auto-link cross-references between Family Hub pages
// ============================================================================
// Hub prose is full of references like "the full bylaws live on the Documents
// page" or "See Co-op Jobs for the menu". That copy is Board-editable Sanity
// content (seeded in scripts/seed-hub-knowledge.mjs) with no link marks, and
// Sanity writes are quota-blocked, so we can't re-author it at the source. So,
// exactly like wcp-email-copy.ts does for plain-text emails, we linkify these
// page references on the RENDERED DOM: whatever field they came from (portable
// text, a section lead, a card body, a footnote) they're all just text nodes by
// the time they reach the browser, so one client pass covers every one.
//
// Precision over recall — these are prose links, so a wrong one is worse than a
// missed one:
//   - CASE-SENSITIVE, proper-noun matching, so "the Documents page" links but
//     "documents you signed" / "fundraising money" never do.
//   - Common-word page names (Documents, Calendar, Health, ...) require the
//     literal " page" suffix; only the distinctive multi-word names (Co-op Jobs,
//     Super Helper, Getting Started, Twos & Threes, Budget & Fundraising) link
//     on their own.
//   - FIRST occurrence per target per page only, so a page that says
//     "Documents page" three times gets one link, not three.
//   - Never self-links (the Documents page won't link its own name), never
//     touches existing links / buttons / headings / code (SKIP set + no <hN>).
//
// No-JS visitors just see the plain text, same accepted trade as the emails.
// Opt out of a specific element with data-no-autolink. Skipped in /preview so
// Sanity's stega click-to-edit text nodes stay intact.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

// [group name, hub route slug, regex source]. Order matters only for overlap;
// the combined matcher uses named groups so the winning alternative names its
// own route. `(?: page)?` = links "Co-op Jobs" OR "Co-op Jobs page"; a bare
// " page" in the source = the suffix is REQUIRED (common-word names).
const TARGETS: [group: string, slug: string, src: string][] = [
  ['coopJobs', 'coop-jobs', 'Co-?op Jobs(?: page)?'],
  ['superHelper', 'super-helper', '(?:Become a )?Super Helper(?: page)?'],
  ['gettingStarted', 'getting-started', 'Getting Started(?: page)?'],
  ['twosThrees', 'twos-threes', 'Twos (?:&|and) Threes(?: page)?'],
  ['fundraising', 'fundraising', 'Budget (?:&|and) Fundraising(?: page)?|Fundraising page'],
  ['documents', 'documents', 'Documents page'],
  ['calendar', 'calendar', 'Calendar page'],
  ['directory', 'directory', 'Directory page'],
  ['tuition', 'tuition', 'Tuition page'],
  ['health', 'health', 'Health page'],
  ['updates', 'updates', 'Updates page'],
  // "Pre-K" alone is too common to link ("Pre-K AM", tuition rows, ...), but a
  // parenthetical "(Pre-K)" is always a class-page reference — the teacher list
  // on Getting Started writes "lisa@ (Pre-K)" the same way it writes
  // "erin@ (Twos & Threes)", which links via its own target above.
  ['preK', 'pre-k', 'Pre-?K page|Pre-?K(?=\\))'],
];

const SKIP = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'KBD',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
]);

/** Current hub route slug, e.g. "/family-hub/documents" -> "documents",
 *  "/family-hub" or "/family-hub/" -> "" (home). */
function currentSlug(): string {
  const m = location.pathname.match(/\/family-hub(?:\/([^/]+))?\/?$/);
  return m?.[1] ?? '';
}

/** Escape a class name so it is matched literally inside the combined regex. */
const escapeRe = (s: string): string => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

/**
 * One extra target per CLASS, read from the list the rail prints
 * (`data-hub-classes`, see HubRail.astro).
 *
 * The committed TARGETS above name the pages the site shipped with, so a class
 * the Board adds would never link from prose. These derive themselves. The
 * literal " page" suffix is REQUIRED on every one of them: a class name is an
 * ordinary word ("Summer", "Fours") and linking it bare would turn half the
 * handbook into links. The group name is positional so it can never collide
 * with a committed one.
 */
function classTargets(): [group: string, slug: string, src: string][] {
  const tag = document.querySelector('[data-hub-classes]');
  if (!tag?.textContent) return [];
  try {
    const rows = JSON.parse(tag.textContent) as { label?: string; page?: string }[];
    if (!Array.isArray(rows)) return [];
    const seen = new Set<string>();
    const out: [string, string, string][] = [];
    for (const row of rows) {
      const label = row?.label?.trim();
      const slug = row?.page?.split('/').pop();
      if (!label || !slug || seen.has(label)) continue;
      seen.add(label);
      out.push([`cls${out.length}`, slug, `${escapeRe(label)} page`]);
    }
    return out;
  } catch {
    return [];
  }
}

function linkifyPageRefs(root: ParentNode, currentRoute: string): void {
  // Drop the current page's own target so it never self-links, then build one
  // case-sensitive, global matcher from the rest. A committed target wins over
  // a derived one at the same address (the committed ones link without the
  // " page" suffix, which is the friendlier match).
  const known = new Set(TARGETS.map(([, slug]) => slug));
  const all = [...TARGETS, ...classTargets().filter(([, slug]) => !known.has(slug))];
  const active = all.filter(([, slug]) => slug !== currentRoute);
  if (active.length === 0) return;
  const groupSlug = new Map(active.map(([group, slug]) => [group, slug]));
  // Leading boundary is a captured (^|\W), not a (?<!\w) lookbehind: lookbehind
  // only reached Safari in 16.4, and `new RegExp` with one THROWS at construction
  // on older iOS — which silently killed this whole module there. The boundary
  // char (if any) is re-emitted as plain text before the link below. Lookahead
  // ((?!\w), (?=\))) is fine everywhere.
  const combined = new RegExp(
    '(^|\\W)(?:' + active.map(([group, , src]) => `(?<${group}>${src})`).join('|') + ')(?!\\w)',
    'g',
  );

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const v = node.nodeValue;
      if (!v || !v.trim()) return NodeFilter.FILTER_REJECT;
      for (let p = (node as Text).parentElement; p && p !== root; p = p.parentElement) {
        if (SKIP.has(p.tagName) || p.isContentEditable || p.hasAttribute('data-no-autolink'))
          return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const targets: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) targets.push(n as Text);

  const used = new Set<string>(); // routes already linked once on this page
  for (const node of targets) {
    const text = node.nodeValue as string;
    let last = 0;
    let frag: DocumentFragment | null = null;
    for (const m of text.matchAll(combined)) {
      const lead = m[1] ?? ''; // the captured boundary char, kept as plain text
      const idx = (m.index ?? 0) + lead.length;
      const matched = m[0].slice(lead.length);
      const group = m.groups && Object.keys(m.groups).find((k) => m.groups?.[k] !== undefined);
      const slug = group ? groupSlug.get(group) : undefined;
      if (!slug || used.has(slug)) continue; // unknown, or already linked once
      used.add(slug);
      frag ??= document.createDocumentFragment();
      if (idx > last) frag.append(text.slice(last, idx));
      const a = document.createElement('a');
      a.href = `/family-hub/${slug}`;
      a.textContent = matched;
      a.className = 'wcp-hub-pagelink';
      frag.append(a);
      last = idx + matched.length;
    }
    if (frag) {
      if (last < text.length) frag.append(text.slice(last));
      node.replaceWith(frag);
    }
  }
}

onPageLoad(() => {
  if (!location.pathname.startsWith('/family-hub')) return;
  if (location.pathname.startsWith('/preview')) return;
  const main = document.getElementById('main');
  if (main) linkifyPageRefs(main, currentSlug());
});
