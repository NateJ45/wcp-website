import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { useClient } from 'sanity';
import { usePresentationNavigate, usePresentationParams } from 'sanity/presentation';
import {
  Box,
  Button,
  Card,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@sanity/ui';
import { AddIcon } from '@sanity/icons/Add';
import { LaunchIcon } from '@sanity/icons/Launch';
import { EllipsisVerticalIcon } from '@sanity/icons/EllipsisVertical';
import { CopyIcon } from '@sanity/icons/Copy';
import { ArchiveIcon } from '@sanity/icons/Archive';
import { RestoreIcon } from '@sanity/icons/Restore';
import { DragHandleIcon } from '@sanity/icons/DragHandle';
import { ShareIcon } from '@sanity/icons/Share';
import { useShareDraftLink, SHARE_LINK_TTL_PHRASE } from './shareDraftLink';
import { newKey, regenerateKeys } from '../../lib/sanity-keys';
import { sectionLabel } from '../../lib/page-checks';

// =============================================================================
// PreviewNavigator — the Squarespace-style page list beside the live preview
// =============================================================================
// Docked to the left of the Presentation tool (components.unstable_navigator).
// Click a page and the preview jumps there while the edit panel follows
// (Presentation resolves the URL through resolve.mainDocuments). One factory,
// two flavors: the Public website workspace lists `page` docs, the Family Hub
// workspace lists `hubPage` docs on the gated hub preview route.
//
// The Squarespace ideas layered on top of the plain list (2026-08-24):
//  - Status dots: amber = published with unpublished edits, hollow = never
//    published. Answers "did my change go live?" at a glance.
//  - Grouping: the public list splits into "In the menu" vs "Not in the menu"
//    (from the `navigation` doc), so an orphan page is visibly an orphan.
//    The hub list splits built-in pages from Board-created ones.
//  - A live-page link (↗) per published row, so preview and reality never blur.
//  - "+ New page": creates a fresh draft and opens it right here, no trip back
//    to the Structure tool.
//  - Site-wide shortcuts (menus / settings / alert) at the bottom, so the
//    whole editing session can live inside Presentation.
//
// Pages as first-class objects (2026-08-27) — three more things a row can do:
//  - Duplicate: copies the page into a NEW draft, "… copy" / "…-copy".
//  - Copy share link (public list only): a one-hour link that shows the DRAFT
//    to a reviewer with no Sanity login. Hub rows do not get it — the reason is
//    in src/sanity/urls.ts.
//  - Archive / Restore: sets `archived` on the document. Every live-site query
//    skips an archived page, but nothing is deleted, so Restore is complete.
//    Archived rows collect in a group at the bottom of both lists.
//  - Drag (public list only): the grip on a row moves it inside "In the menu"
//    to reorder the header menu, or between the two groups to add it to the
//    menu or take it out. Each drag patches the `navigation` document's
//    mainNav. The grip is a SEPARATE element from the row button, so a drag
//    can never be read as a click.
//
// Saved sections (2026-08-27, public list only): a collapsible group under the
// page list showing every `sectionPreset` document, each with an "add to the
// page you are looking at" button. It lives here because the page form's own
// "+ Add section" picker can only offer schema TYPES, never documents.
//
// The lists LIVE-refresh through client.listen, so a rename, a new page, or a
// publish shows up without reopening the tool.
// =============================================================================

/** One page document, both twins collapsed into a single row. */
interface NavRow {
  /** Published (un-prefixed) doc id. */
  id: string;
  type: string;
  label: string;
  href: string;
  /** Where the row lives on the REAL site (undefined until first publish). */
  liveHref?: string;
  hasDraft: boolean;
  hasPublished: boolean;
  group: string;
  archived: boolean;
  /** PUBLIC: the mainNav item `_key`, when the page is a top-level menu item. */
  navKey?: string;
  /** PUBLIC: position among the top-level mainNav items. */
  navIndex?: number;
  /** PUBLIC: the page is in the menu only INSIDE a dropdown, so not draggable. */
  navChild?: boolean;
}

/** A raw page/hubPage document, as the list query returns it. */
interface DocRow {
  _id: string;
  title?: string;
  slug?: string;
  heading?: string;
  hubKey?: string;
  archived?: boolean;
}

/** One raw member of the Menus document's mainNav array. */
interface NavItemRaw {
  _key?: string;
  _type?: string;
  label?: string;
  page?: { _type?: string; _ref?: string };
  children?: { page?: { _ref?: string } }[];
  [key: string]: unknown;
}

/** The Menus document the drag writes to, and its current mainNav. */
interface NavState {
  id: string;
  items: NavItemRaw[];
}

/** One saved section (a `sectionPreset` document), ready to add to a page. */
interface PresetRow {
  id: string;
  title: string;
  sectionType: string;
  /** The captured section object, exactly as it will be appended. */
  section: Record<string, unknown> | null;
}

/** A raw sectionPreset document, as the list query returns it. */
interface PresetDoc {
  _id: string;
  title?: string;
  sectionType?: string;
  section?: unknown;
}

interface Data {
  docs: DocRow[];
  /** PUBLIC only. null when no Menus document exists yet. */
  nav: NavState | null;
  /** PUBLIC only. The saved sections, by name. */
  presets: PresetRow[];
}

const APIV = '2025-01-01';
const ARCHIVED_GROUP = 'Archived';

/** Past this many saved sections the list stops being scannable — say so. */
const PRESET_SOFT_CAP = 30;

// "home" lives at the preview root; everything else under its slug.
const pageHref = (slug: string) => (slug === 'home' ? '/preview' : `/preview/${slug}`);

// Collapse draft + published twins of one document into a single row's status.
function collapse<T extends { _id: string }>(
  docs: T[],
): Map<string, { doc: T; draft: boolean; published: boolean }> {
  const byId = new Map<string, { doc: T; draft: boolean; published: boolean }>();
  for (const d of docs) {
    const isDraft = d._id.startsWith('drafts.');
    const id = d._id.replace(/^drafts\./, '');
    const entry = byId.get(id) ?? { doc: d, draft: false, published: false };
    if (isDraft) {
      entry.draft = true;
      // Prefer the draft's field values: that is what the editor last typed.
      entry.doc = d;
    } else {
      entry.published = true;
      if (!entry.draft) entry.doc = d;
    }
    byId.set(id, entry);
  }
  return byId;
}

/**
 * Read the Menus document the editor is working on.
 *
 * The DRAFT wins when one exists: that is the menu the editor last touched, and
 * the menu the drag must go on editing. Without a draft the published document
 * is the only one there is.
 */
function pickNav(docs: { _id: string; mainNav?: NavItemRaw[] }[]): NavState | null {
  const doc = docs.find((d) => d._id.startsWith('drafts.')) ?? docs[0];
  return doc ? { id: doc._id, items: Array.isArray(doc.mainNav) ? doc.mainNav : [] } : null;
}

/**
 * Collapse the saved-section documents into rows, newest wording first (the
 * draft twin wins, same rule as the page list), sorted by name.
 */
function buildPresets(docs: PresetDoc[]): PresetRow[] {
  const rows: PresetRow[] = [];
  for (const [id, { doc }] of collapse(docs)) {
    const held = Array.isArray(doc.section) ? doc.section[0] : null;
    const section =
      held && typeof held === 'object' && !Array.isArray(held)
        ? (held as Record<string, unknown>)
        : null;
    const type =
      doc.sectionType ||
      (section && typeof section._type === 'string' ? (section._type as string) : '');
    rows.push({ id, title: doc.title || '(unnamed saved section)', sectionType: type, section });
  }
  rows.sort((a, b) => a.title.localeCompare(b.title));
  return rows;
}

async function fetchData(
  client: ReturnType<typeof useClient>,
  kind: 'public' | 'hub',
): Promise<Data> {
  // Raw perspective on purpose: we need BOTH the draft and published twins
  // to compute each row's status dot.
  if (kind === 'public') {
    const [docs, navDocs, presetDocs] = await Promise.all([
      client.fetch<DocRow[]>('*[_type == "page" && defined(slug)]{ _id, title, slug, archived }'),
      // The RAW mainNav (page references, not resolved slugs): the drag has to
      // write this array back, and a reference matches a row by document id.
      client.fetch<{ _id: string; mainNav?: NavItemRaw[] }[]>(
        '*[_type == "navigation"]{ _id, mainNav }',
      ),
      // The whole `section` value, because adding one to a page is a plain
      // copy of it — there is nothing to resolve.
      client.fetch<PresetDoc[]>('*[_type == "sectionPreset"]{ _id, title, sectionType, section }'),
    ]);
    return { docs, nav: pickNav(navDocs), presets: buildPresets(presetDocs) };
  }

  const docs = await client.fetch<DocRow[]>(
    '*[_type == "hubPage" && (defined(hubKey) || defined(slug))]{ _id, title, heading, hubKey, slug, archived }',
  );
  return { docs, nav: null, presets: [] };
}

/** Group titles, in display order, for one flavor. */
function groupTitles(kind: 'public' | 'hub'): string[] {
  return kind === 'public'
    ? ['In the menu', 'Not in the menu', ARCHIVED_GROUP]
    : ['Hub pages', 'Board-created pages', ARCHIVED_GROUP];
}

/**
 * Turn the fetched documents into rows.
 *
 * Pure, so a drag can rebuild the list from a changed mainNav array at once and
 * the panel never waits for the round trip.
 */
function buildRows(kind: 'public' | 'hub', data: Data): NavRow[] {
  if (kind === 'public') {
    // Which page each top-level menu item points at, and where it sits.
    const topLevel = new Map<string, { key: string; index: number }>();
    const inGroup = new Set<string>();
    (data.nav?.items ?? []).forEach((item, index) => {
      const ref = item.page?._ref;
      if (ref && item._key) topLevel.set(ref, { key: item._key, index });
      for (const child of item.children ?? []) {
        if (child.page?._ref) inGroup.add(child.page._ref);
      }
    });

    const rows: NavRow[] = [];
    for (const [id, { doc, draft, published }] of collapse(data.docs)) {
      if (!doc.slug) continue;
      const spot = topLevel.get(id);
      const child = !spot && inGroup.has(id);
      // Home is the site root. It is always "in the menu", menu item or not.
      const inMenu = Boolean(spot) || child || doc.slug === 'home';
      rows.push({
        id,
        type: 'page',
        label: doc.title || doc.slug,
        href: pageHref(doc.slug),
        liveHref: published ? (doc.slug === 'home' ? '/' : `/${doc.slug}`) : undefined,
        hasDraft: draft,
        hasPublished: published,
        archived: doc.archived === true,
        group: doc.archived === true ? ARCHIVED_GROUP : inMenu ? 'In the menu' : 'Not in the menu',
        ...(spot ? { navKey: spot.key, navIndex: spot.index } : {}),
        ...(child ? { navChild: true } : {}),
      });
    }
    // Menu order is the point of the first group, so sort by it. Home leads,
    // then the menu itself, then anything only in a dropdown, by name.
    rows.sort(
      (a, b) =>
        (a.href === '/preview' ? -1 : b.href === '/preview' ? 1 : 0) ||
        (a.navIndex ?? Number.MAX_SAFE_INTEGER) - (b.navIndex ?? Number.MAX_SAFE_INTEGER) ||
        a.label.localeCompare(b.label),
    );
    return rows;
  }

  const rows: NavRow[] = [];
  for (const [id, { doc, draft, published }] of collapse(data.docs)) {
    const key = doc.hubKey || doc.slug;
    const label = doc.title || doc.heading || key || '';
    if (!key || !label) continue;
    rows.push({
      id,
      type: 'hubPage',
      label,
      href: `/preview/family-hub/${key}`,
      liveHref: published ? `/family-hub/${key === 'home' ? '' : key}` : undefined,
      hasDraft: draft,
      hasPublished: published,
      archived: doc.archived === true,
      group:
        doc.archived === true ? ARCHIVED_GROUP : doc.hubKey ? 'Hub pages' : 'Board-created pages',
    });
  }
  rows.sort(
    (a, b) =>
      (a.href.endsWith('/home') ? -1 : b.href.endsWith('/home') ? 1 : 0) ||
      a.label.localeCompare(b.label),
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Duplicate — copy a page into a new draft
// ---------------------------------------------------------------------------

// `regenerateKeys` (every nested `_key` replaced) lives in
// src/lib/sanity-keys.ts — the duplicate here and the preset copy share it.

/**
 * A free web address for the copy: "about" → "about-copy", then "about-copy-2",
 * "about-copy-3", and so on until nothing else holds it.
 */
function freeSlug(base: string, taken: Set<string>): string {
  const first = `${base}-copy`;
  if (!taken.has(first)) return first;
  for (let n = 2; n < 200; n += 1) {
    const next = `${first}-${n}`;
    if (!taken.has(next)) return next;
  }
  return `${first}-${newKey()}`;
}

// The site-wide singletons an editor reaches for mid-session. Doc id = type
// (the structure's singleton convention).
const SHORTCUTS: Record<'public' | 'hub', { type: string; label: string }[]> = {
  public: [
    { type: 'navigation', label: 'Menus (header & footer)' },
    { type: 'siteSettings', label: 'Site settings' },
    { type: 'closureAlert', label: 'Alert banner' },
  ],
  hub: [
    { type: 'hubNavMenu', label: 'Family Hub menu' },
    { type: 'hubSettings', label: 'Hub settings' },
    { type: 'closureAlert', label: 'Alert banner' },
  ],
};

/** The status dot: amber = live page with unpublished edits; hollow = never
    published. Published-and-clean rows render nothing. */
function StatusDot({ row }: { row: NavRow }) {
  if (!row.hasDraft) return null;
  const unpublished = !row.hasPublished;
  return (
    <span
      title={unpublished ? 'Not published yet' : 'Has unpublished edits'}
      style={{
        flexShrink: 0,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: unpublished ? 'transparent' : '#f59e0b',
        border: unpublished ? '1.5px solid #9aa4b2' : 'none',
      }}
    />
  );
}

export function makePreviewNavigator(kind: 'public' | 'hub'): ComponentType {
  return function PreviewNavigator() {
    const client = useClient({ apiVersion: APIV });
    const navigate = usePresentationNavigate();
    const params = usePresentationParams();
    const toast = useToast();
    // "Copy share link" — mint a one-hour link that shows this page's DRAFT to
    // someone with no Sanity login (see shareDraftLink.tsx). PUBLIC LIST ONLY:
    // the link carries the Studio preview cookie, and that cookie is the whole
    // gate on the hub preview route, so a hub link would show family-only
    // content to whoever holds it. See src/sanity/urls.ts.
    const { share, sharing } = useShareDraftLink();
    const [data, setData] = useState<Data | null>(null);
    const [creating, setCreating] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const refetch = useCallback(() => {
      fetchData(client, kind)
        .then(setData)
        .catch(() => setData({ docs: [], nav: null, presets: [] }));
    }, [client]);

    useEffect(() => {
      refetch();
      // Live refresh: any page/menu mutation (rename, publish, new page) →
      // refetch after a short settle. visibility:'query' waits until the
      // change is queryable, so the refetch actually sees it.
      const types = kind === 'public' ? ['page', 'navigation', 'sectionPreset'] : ['hubPage'];
      let timer: ReturnType<typeof setTimeout> | undefined;
      const sub = client
        .listen('*[_type in $types]', { types }, { visibility: 'query', events: ['mutation'] })
        .subscribe(() => {
          clearTimeout(timer);
          timer = setTimeout(refetch, 800);
        });
      return () => {
        clearTimeout(timer);
        sub.unsubscribe();
      };
    }, [client, refetch]);

    // params.preview is the iframe's current URL; compare pathnames so query
    // strings never break the highlight.
    const current = (params.preview ?? '').split('?')[0];

    // STICKY navigation (2026-08-28, editor feedback on presacademy): every
    // preview page change is a full document load, and Presentation can only
    // hand the iframe its next URL once the NEW page's visual-editing script
    // has reconnected. A click that lands inside that window (an editor
    // moving quickly through the page list) is silently dropped. So a click
    // records its intent and an effect re-issues navigate() every 750ms until
    // params.preview reports the requested path (or ~6s pass). When the first
    // navigate lands immediately, `current` matches at once and no retry ever
    // fires. `pending` also drives the row highlight, so the list responds to
    // the click instantly instead of after the page load.
    const [pending, setPending] = useState<{ href: string; type: string; id: string } | null>(null);
    const go = useCallback(
      (href: string, type: string, id: string) => {
        setPending({ href, type, id });
        navigate(href, { type, id });
      },
      [navigate],
    );
    useEffect(() => {
      if (!pending) return;
      if (current === pending.href) {
        setPending(null);
        return;
      }
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (tries > 8) {
          clearInterval(timer);
          setPending(null);
          return;
        }
        navigate(pending.href, { type: pending.type, id: pending.id });
      }, 750);
      return () => clearInterval(timer);
    }, [pending, current, navigate]);

    // "+ New page": create an empty DRAFT (so nothing half-made ever
    // publishes itself) and open it in the edit panel right here. The preview
    // stays where it is until the new page gets a slug.
    const createPage = useCallback(async () => {
      setCreating(true);
      try {
        const id = crypto.randomUUID();
        await client.create({
          _id: `drafts.${id}`,
          _type: kind === 'public' ? 'page' : 'hubPage',
        });
        navigate(current || '/preview', {
          type: kind === 'public' ? 'page' : 'hubPage',
          id,
        });
        refetch();
      } finally {
        setCreating(false);
      }
    }, [client, navigate, current, refetch]);

    // -----------------------------------------------------------------------
    // Duplicate
    // -----------------------------------------------------------------------
    // The copy is a DRAFT, so it is never live by accident, and it starts from
    // the draft twin when there is one (the newest words). Every nested `_key`
    // is replaced: two array members with one key is a Studio-level error.
    // A hub copy loses its `hubKey` on purpose — a second document claiming a
    // built-in page would make which one the hub shows a coin toss.
    const duplicatePage = useCallback(
      async (row: NavRow) => {
        setBusyId(row.id);
        try {
          const found = await client.fetch<Record<string, unknown>[]>('*[_id in $ids]', {
            ids: [`drafts.${row.id}`, row.id],
          });
          const source = found.find((d) => String(d._id).startsWith('drafts.')) ?? found[0] ?? null;
          if (!source) {
            toast.push({ status: 'error', title: 'Could not read that page.' });
            return;
          }

          const copy = regenerateKeys(source) as Record<string, unknown>;
          delete copy._id;
          delete copy._rev;
          delete copy._createdAt;
          delete copy._updatedAt;
          delete copy.hubKey;

          const takenSlugs = new Set(
            await client.fetch<string[]>('*[_type == $type && defined(slug)].slug', {
              type: row.type,
            }),
          );
          const baseSlug =
            typeof source.slug === 'string' && source.slug
              ? source.slug
              : typeof source.hubKey === 'string' && source.hubKey
                ? source.hubKey
                : 'page';
          copy.slug = freeSlug(baseSlug, takenSlugs);
          copy.title = `${typeof source.title === 'string' && source.title ? source.title : row.label} copy`;
          // A copy starts out of the menu and out of the archive.
          delete copy.archived;

          const id = crypto.randomUUID();
          await client.create({ ...copy, _id: `drafts.${id}`, _type: row.type });

          const href =
            row.type === 'page'
              ? pageHref(String(copy.slug))
              : `/preview/family-hub/${String(copy.slug)}`;
          go(href, row.type, id);
          refetch();
          toast.push({
            status: 'success',
            title: `Copied “${row.label}”`,
            description: 'The copy is a draft. Change what you need, then Publish it.',
          });
        } catch (err) {
          console.error('[navigator] duplicate failed', err);
          toast.push({ status: 'error', title: 'Could not copy that page. Please try again.' });
        } finally {
          setBusyId(null);
        }
      },
      [client, go, refetch, toast],
    );

    // -----------------------------------------------------------------------
    // Archive / Restore
    // -----------------------------------------------------------------------
    // A patch on BOTH twins, never a delete: a delete is refused while another
    // document links to the page, and it throws the words away. The archived
    // flag only hides the page from the site.
    const setArchived = useCallback(
      async (row: NavRow, archived: boolean) => {
        setBusyId(row.id);
        try {
          const tx = client.transaction();
          const apply = (id: string) =>
            archived
              ? tx.patch(id, (p) => p.set({ archived: true }))
              : tx.patch(id, (p) => p.unset(['archived']));
          if (row.hasDraft) apply(`drafts.${row.id}`);
          if (row.hasPublished) apply(row.id);
          await tx.commit();
          refetch();
          toast.push({
            status: 'success',
            title: archived ? `Archived “${row.label}”` : `Restored “${row.label}”`,
            description: archived
              ? 'It is off the site and kept here. Publish to make that live.'
              : 'It is back on the site. Publish to make that live.',
          });
        } catch (err) {
          console.error('[navigator] archive failed', err);
          toast.push({ status: 'error', title: 'Could not do that. Please try again.' });
        } finally {
          setBusyId(null);
        }
      },
      [client, refetch, toast],
    );

    const rows = useMemo(() => (data ? buildRows(kind, data) : null), [data]);

    const grouped = useMemo(() => {
      if (!rows) return null;
      return groupTitles(kind)
        .map((g) => ({ title: g, rows: rows.filter((r) => r.group === g) }))
        .filter((g) => g.rows.length > 0);
    }, [rows]);

    // -----------------------------------------------------------------------
    // Saved sections (public list only)
    // -----------------------------------------------------------------------
    // The "+ Add section" picker inside a page can only offer schema TYPES, so
    // a saved section (a `sectionPreset` DOCUMENT) has no way in there. This
    // panel already knows which page the preview is on, so it is the one place
    // that can say "add this to the page you are looking at".
    const [presetsOpen, setPresetsOpen] = useState(false);

    // Which page the preview is showing, as a row. `pending` wins so a click
    // and an immediate "Add" land on the same page. An exact href match first;
    // the endsWith fallback is the same one the row highlight uses.
    const currentRow = useMemo(() => {
      if (!rows) return null;
      const href = pending?.href ?? current;
      if (!href) return null;
      return rows.find((r) => r.href === href) ?? rows.find((r) => href.endsWith(r.href)) ?? null;
    }, [rows, pending, current]);

    /**
     * Append a saved section to the CURRENT page's draft.
     *
     * The write always goes to the draft: a preset must never change the live
     * page on its own, and the editor still presses Publish. When the page has
     * no draft yet we make one from the published document first, which is
     * exactly what typing in the form would have done.
     */
    const addPreset = useCallback(
      async (preset: PresetRow) => {
        if (!currentRow || !preset.section) return;
        setBusyId(preset.id);
        const draftId = `drafts.${currentRow.id}`;
        try {
          const draft = await client.fetch<{ _id: string } | null>('*[_id == $id][0]{_id}', {
            id: draftId,
          });
          if (!draft) {
            const published = await client.fetch<Record<string, unknown> | null>(
              '*[_id == $id][0]',
              {
                id: currentRow.id,
              },
            );
            if (!published) {
              toast.push({ status: 'error', title: 'Could not read that page.' });
              return;
            }
            const copy: Record<string, unknown> = { ...published, _id: draftId };
            delete copy._rev;
            delete copy._createdAt;
            delete copy._updatedAt;
            await client.createIfNotExists(copy as never);
          }

          // Fresh keys at every depth, so the same preset can be added twice.
          const section = regenerateKeys({ ...preset.section, _key: newKey() }) as Record<
            string,
            unknown
          >;
          await client
            .patch(draftId)
            .setIfMissing({ sections: [] })
            .append('sections', [section])
            .commit();

          refetch();
          toast.push({
            status: 'success',
            title: `Added “${preset.title}” to ${currentRow.label}`,
            description:
              'It is at the bottom of the page. Drag it where you want it, then Publish.',
            duration: 8000,
          });
        } catch (err) {
          console.error('[navigator] add preset failed', err);
          toast.push({
            status: 'error',
            title: 'Could not add that saved section. Please try again.',
          });
        } finally {
          setBusyId(null);
        }
      },
      [client, currentRow, refetch, toast],
    );

    // -----------------------------------------------------------------------
    // Drag: menu membership and menu order (public list only)
    // -----------------------------------------------------------------------
    // Only TOP-LEVEL membership moves. A page that is in the menu inside a
    // dropdown keeps no grip, and a dropdown keeps its own links when it moves.
    // The write goes to the DRAFT Menus document when one exists, and to the
    // published one when it does not (see pickNav) — the same document the
    // Menus editor would write. Optimistic: the list redraws from the new array
    // at once, and the listen-driven refetch settles it.
    const [dragId, setDragId] = useState<string | null>(null);
    const [dropOn, setDropOn] = useState<string | null>(null);
    const canDrag = kind === 'public';

    const writeMenu = useCallback(
      async (items: NavItemRaw[]) => {
        const nav = data?.nav;
        if (!nav) {
          toast.push({
            status: 'warning',
            title: 'No menu to change yet',
            description: 'Open “Menus (header & footer)” once, then try again.',
          });
          return;
        }
        setData({ docs: data.docs, presets: data.presets, nav: { id: nav.id, items } }); // optimistic
        try {
          await client.patch(nav.id).set({ mainNav: items }).commit();
          refetch();
        } catch (err) {
          console.error('[navigator] menu write failed', err);
          toast.push({ status: 'error', title: 'Could not change the menu. Please try again.' });
          refetch();
        }
      },
      [client, data, refetch, toast],
    );

    /** Move a row into the menu, out of it, or to a new place inside it. */
    const dropRow = useCallback(
      (target: { group: string; beforeId?: string }) => {
        const source = rows?.find((r) => r.id === dragId);
        setDragId(null);
        setDropOn(null);
        if (!source || !data?.nav) return;
        if (target.group === ARCHIVED_GROUP) return; // archiving is a menu action

        const items = [...data.nav.items];
        const from = items.findIndex((i) => i._key === source.navKey);

        if (target.group === 'Not in the menu') {
          if (from < 0) return; // already out of the menu
          items.splice(from, 1);
          void writeMenu(items);
          return;
        }

        // Where the row lands: before the row it was dropped on, or last.
        const beforeRow = target.beforeId ? rows?.find((r) => r.id === target.beforeId) : undefined;
        const beforeAt = beforeRow?.navKey
          ? items.findIndex((i) => i._key === beforeRow.navKey)
          : items.length;

        if (from >= 0) {
          if (from === beforeAt) return;
          const [moved] = items.splice(from, 1);
          const to = from < beforeAt ? beforeAt - 1 : beforeAt;
          items.splice(to, 0, moved);
        } else {
          items.splice(beforeAt < 0 ? items.length : beforeAt, 0, {
            _key: newKey(),
            _type: 'navLink',
            label: source.label,
            linkType: 'page',
            page: { _type: 'reference', _ref: source.id },
          });
        }
        void writeMenu(items);
      },
      [data, dragId, rows, writeMenu],
    );

    return (
      <Flex direction="column" style={{ height: '100%' }}>
        <Box flex={1} padding={3} style={{ overflowY: 'auto' }}>
          <Stack space={4}>
            {grouped === null ? (
              <Flex align="center" gap={2} padding={2}>
                <Spinner muted />
                <Text size={1} muted>
                  Loading…
                </Text>
              </Flex>
            ) : grouped.length === 0 ? (
              <Text size={1} muted>
                No pages yet.
              </Text>
            ) : (
              grouped.map((group) => (
                <Stack
                  key={group.title}
                  space={2}
                  onDragOver={
                    canDrag && dragId && group.title !== ARCHIVED_GROUP
                      ? (e) => e.preventDefault()
                      : undefined
                  }
                  onDrop={
                    canDrag && dragId && group.title !== ARCHIVED_GROUP
                      ? () => dropRow({ group: group.title })
                      : undefined
                  }
                >
                  <Text size={1} weight="semibold" muted style={{ textTransform: 'uppercase' }}>
                    {group.title}
                  </Text>
                  <Stack space={1}>
                    {group.rows.map((r) => {
                      const active = pending
                        ? pending.href === r.href
                        : current === r.href || current.endsWith(r.href);
                      // A row is draggable when the menu can actually hold it:
                      // public list, not archived, not pinned home, and not a
                      // link that lives inside a dropdown.
                      const draggable =
                        canDrag &&
                        !r.archived &&
                        !r.navChild &&
                        r.href !== '/preview' &&
                        Boolean(data?.nav);
                      return (
                        <Flex
                          key={r.id}
                          align="center"
                          gap={1}
                          style={dropOn === r.id ? { boxShadow: '0 -2px 0 0 #2276fc' } : undefined}
                          onDragOver={
                            canDrag && dragId && group.title !== ARCHIVED_GROUP
                              ? (e) => {
                                  e.preventDefault();
                                  setDropOn(r.id);
                                }
                              : undefined
                          }
                          onDragLeave={
                            canDrag && dragId
                              ? () => setDropOn((v) => (v === r.id ? null : v))
                              : undefined
                          }
                          onDrop={
                            canDrag && dragId && group.title !== ARCHIVED_GROUP
                              ? (e) => {
                                  e.stopPropagation();
                                  dropRow({ group: group.title, beforeId: r.id });
                                }
                              : undefined
                          }
                        >
                          {draggable && (
                            /* The grip is its own element so a drag never
                               fights the row's click-to-open. */
                            <span
                              draggable
                              onDragStart={() => setDragId(r.id)}
                              onDragEnd={() => {
                                setDragId(null);
                                setDropOn(null);
                              }}
                              title="Drag to change the menu"
                              aria-label={`Drag ${r.label} to change the menu`}
                              style={{
                                cursor: 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#9aa4b2',
                                flexShrink: 0,
                              }}
                            >
                              <DragHandleIcon />
                            </span>
                          )}
                          <Card
                            as="button"
                            flex={1}
                            padding={2}
                            radius={2}
                            tone={active ? 'primary' : 'default'}
                            pressed={active}
                            style={{
                              cursor: 'pointer',
                              textAlign: 'left',
                              minWidth: 0,
                              opacity: r.archived ? 0.6 : 1,
                            }}
                            onClick={() => go(r.href, r.type, r.id)}
                          >
                            <Flex align="center" gap={2}>
                              <Text
                                size={1}
                                weight={active ? 'semibold' : 'regular'}
                                textOverflow="ellipsis"
                                style={{ flex: 1, minWidth: 0 }}
                              >
                                {r.label}
                              </Text>
                              <StatusDot row={r} />
                            </Flex>
                          </Card>
                          {r.liveHref && !r.archived && (
                            /* Outside the row button — a button may not nest a
                               link. Opens the REAL page in a new tab. */
                            <Button
                              as="a"
                              href={r.liveHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              mode="bleed"
                              padding={2}
                              icon={LaunchIcon}
                              title={`Open the live page (${r.liveHref})`}
                              aria-label={`Open the live page for ${r.label}`}
                            />
                          )}
                          <MenuButton
                            id={`row-menu-${r.id}`}
                            button={
                              <Button
                                mode="bleed"
                                padding={2}
                                icon={EllipsisVerticalIcon}
                                disabled={busyId === r.id}
                                title={`More for ${r.label}`}
                                aria-label={`More for ${r.label}`}
                              />
                            }
                            popover={{ portal: true, placement: 'bottom-end' }}
                            menu={
                              <Menu>
                                <MenuItem
                                  icon={CopyIcon}
                                  text="Duplicate"
                                  onClick={() => void duplicatePage(r)}
                                />
                                {kind === 'public' && (
                                  <MenuItem
                                    icon={ShareIcon}
                                    text={sharing ? 'Making link…' : 'Copy share link'}
                                    disabled={sharing}
                                    title={`Copy a link that shows this page's draft to someone without a Sanity login. ${SHARE_LINK_TTL_PHRASE}`}
                                    onClick={() => void share(r.href, r.label)}
                                  />
                                )}
                                {r.archived ? (
                                  <MenuItem
                                    icon={RestoreIcon}
                                    text="Restore"
                                    onClick={() => void setArchived(r, false)}
                                  />
                                ) : (
                                  <MenuItem
                                    icon={ArchiveIcon}
                                    text="Archive"
                                    tone="critical"
                                    onClick={() => void setArchived(r, true)}
                                  />
                                )}
                              </Menu>
                            }
                          />
                        </Flex>
                      );
                    })}
                  </Stack>
                </Stack>
              ))
            )}
            <Button
              icon={AddIcon}
              text="New page"
              mode="ghost"
              tone="primary"
              disabled={creating}
              onClick={() => void createPage()}
            />

            {/* Saved sections — closed by default, so the page list stays the
                thing this panel is about. */}
            {kind === 'public' && (
              <Stack space={2}>
                <Button
                  mode="bleed"
                  padding={2}
                  justify="flex-start"
                  onClick={() => setPresetsOpen((v) => !v)}
                  text={`${presetsOpen ? '▾' : '▸'} Saved sections${
                    data?.presets.length ? ` (${data.presets.length})` : ''
                  }`}
                  aria-expanded={presetsOpen}
                  title="Sections you kept from another page, ready to add to this one."
                />
                {presetsOpen && (
                  <Stack space={2}>
                    {!data || data.presets.length === 0 ? (
                      <Text size={1} muted>
                        None yet. Open a page, then use “Save a section as preset…” in its publish
                        menu to keep one here.
                      </Text>
                    ) : (
                      <>
                        {data.presets.length > PRESET_SOFT_CAP && (
                          <Text size={1} muted>
                            That is a lot of saved sections. Deleting the ones nobody uses makes
                            this list findable again.
                          </Text>
                        )}
                        {!currentRow && (
                          <Text size={1} muted>
                            Open a page first, then add one to it.
                          </Text>
                        )}
                        {data.presets.map((p) => (
                          <Flex key={p.id} align="center" gap={1}>
                            <Card
                              as="button"
                              flex={1}
                              padding={2}
                              radius={2}
                              style={{ cursor: 'pointer', textAlign: 'left', minWidth: 0 }}
                              onClick={() =>
                                navigate(current || '/preview', { type: 'sectionPreset', id: p.id })
                              }
                              title={`Open “${p.title}” to change it`}
                            >
                              <Stack space={1}>
                                <Text size={1} textOverflow="ellipsis">
                                  {p.title}
                                </Text>
                                {p.sectionType && (
                                  <Text size={0} muted textOverflow="ellipsis">
                                    {sectionLabel(p.sectionType)}
                                  </Text>
                                )}
                              </Stack>
                            </Card>
                            <Button
                              mode="ghost"
                              padding={2}
                              icon={AddIcon}
                              disabled={!currentRow || !p.section || busyId === p.id}
                              title={
                                !p.section
                                  ? 'This saved section is empty. Open it and put a section in it.'
                                  : currentRow
                                    ? `Add “${p.title}” to ${currentRow.label}`
                                    : 'Open a page first, then add it.'
                              }
                              aria-label={
                                currentRow
                                  ? `Add ${p.title} to ${currentRow.label}`
                                  : `Add ${p.title}`
                              }
                              onClick={() => void addPreset(p)}
                            />
                          </Flex>
                        ))}
                      </>
                    )}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
        {/* Site-wide shortcuts — pinned under the page list so “edit the menu /
            settings / alert” never needs a trip back to the Structure tool. */}
        <Box padding={3} style={{ borderTop: '1px solid var(--card-border-color, #e2e8f0)' }}>
          <Stack space={2}>
            <Text size={1} weight="semibold" muted style={{ textTransform: 'uppercase' }}>
              Site-wide
            </Text>
            <Stack space={1}>
              {SHORTCUTS[kind].map((s) => (
                <Card
                  key={s.type}
                  as="button"
                  padding={2}
                  radius={2}
                  style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  onClick={() => navigate(current || '/preview', { type: s.type, id: s.type })}
                >
                  <Text size={1}>{s.label}</Text>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Flex>
    );
  };
}
