import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { useClient } from 'sanity';
import { usePresentationNavigate, usePresentationParams } from 'sanity/presentation';
import { Box, Button, Card, Flex, Spinner, Stack, Text } from '@sanity/ui';
import { AddIcon } from '@sanity/icons/Add';
import { LaunchIcon } from '@sanity/icons/Launch';

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
// The lists LIVE-refresh through client.listen, so a rename, a new page, or a
// publish shows up without reopening the tool.
// =============================================================================

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
}

interface FetchResult {
  /** Group titles in display order. */
  groups: string[];
  rows: NavRow[];
}

const APIV = '2025-01-01';

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

async function fetchRows(
  client: ReturnType<typeof useClient>,
  kind: 'public' | 'hub',
): Promise<FetchResult> {
  if (kind === 'public') {
    // Raw perspective on purpose: we need BOTH the draft and published twins
    // to compute each row's status dot.
    const [docs, nav] = await Promise.all([
      client.fetch<{ _id: string; title?: string; slug?: string }[]>(
        '*[_type == "page" && defined(slug)]{ _id, title, slug }',
      ),
      client.fetch<{
        mainNav?: { pageSlug?: string; children?: { pageSlug?: string }[] }[];
      } | null>(
        // Prefer the draft menu when one exists — that is what the editor sees.
        '*[_type == "navigation"] | order(_id desc) [0]{ mainNav[]{ "pageSlug": page->slug, children[]{ "pageSlug": page->slug } } }',
      ),
    ]);
    const inMenu = new Set<string>(['home']); // home is the site root — always "in".
    for (const item of nav?.mainNav ?? []) {
      if (item.pageSlug) inMenu.add(item.pageSlug);
      for (const child of item.children ?? []) if (child.pageSlug) inMenu.add(child.pageSlug);
    }
    const rows: NavRow[] = [];
    for (const [id, { doc, draft, published }] of collapse(docs)) {
      if (!doc.slug) continue;
      rows.push({
        id,
        type: 'page',
        label: doc.title || doc.slug,
        href: pageHref(doc.slug),
        liveHref: published ? (doc.slug === 'home' ? '/' : `/${doc.slug}`) : undefined,
        hasDraft: draft,
        hasPublished: published,
        group: inMenu.has(doc.slug) ? 'In the menu' : 'Not in the menu',
      });
    }
    rows.sort(
      (a, b) =>
        (a.href === '/preview' ? -1 : b.href === '/preview' ? 1 : 0) ||
        a.label.localeCompare(b.label),
    );
    return { groups: ['In the menu', 'Not in the menu'], rows };
  }

  const docs = await client.fetch<
    { _id: string; title?: string; heading?: string; hubKey?: string; slug?: string }[]
  >(
    '*[_type == "hubPage" && (defined(hubKey) || defined(slug))]{ _id, title, heading, hubKey, slug }',
  );
  const rows: NavRow[] = [];
  for (const [id, { doc, draft, published }] of collapse(docs)) {
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
      group: doc.hubKey ? 'Hub pages' : 'Board-created pages',
    });
  }
  rows.sort(
    (a, b) =>
      (a.href.endsWith('/home') ? -1 : b.href.endsWith('/home') ? 1 : 0) ||
      a.label.localeCompare(b.label),
  );
  return { groups: ['Hub pages', 'Board-created pages'], rows };
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
    const [data, setData] = useState<FetchResult | null>(null);
    const [creating, setCreating] = useState(false);

    const refetch = useCallback(() => {
      fetchRows(client, kind)
        .then(setData)
        .catch(() => setData({ groups: [], rows: [] }));
    }, [client]);

    useEffect(() => {
      refetch();
      // Live refresh: any page/menu mutation (rename, publish, new page) →
      // refetch after a short settle. visibility:'query' waits until the
      // change is queryable, so the refetch actually sees it.
      const types = kind === 'public' ? ['page', 'navigation'] : ['hubPage'];
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

    const grouped = useMemo(() => {
      if (!data) return null;
      return data.groups
        .map((g) => ({ title: g, rows: data.rows.filter((r) => r.group === g) }))
        .filter((g) => g.rows.length > 0);
    }, [data]);

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
                <Stack key={group.title} space={2}>
                  <Text size={1} weight="semibold" muted style={{ textTransform: 'uppercase' }}>
                    {group.title}
                  </Text>
                  <Stack space={1}>
                    {group.rows.map((r) => {
                      const active = current === r.href || current.endsWith(r.href);
                      return (
                        <Flex key={r.id} align="center" gap={1}>
                          <Card
                            as="button"
                            flex={1}
                            padding={2}
                            radius={2}
                            tone={active ? 'primary' : 'default'}
                            pressed={active}
                            style={{ cursor: 'pointer', textAlign: 'left', minWidth: 0 }}
                            onClick={() => navigate(r.href, { type: r.type, id: r.id })}
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
                          {r.liveHref && (
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
