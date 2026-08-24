import { useEffect, useState, type ComponentType } from 'react';
import { useClient } from 'sanity';
import { usePresentationNavigate, usePresentationParams } from 'sanity/presentation';
import { Box, Card, Flex, Spinner, Stack, Text } from '@sanity/ui';

// =============================================================================
// PreviewNavigator — the Squarespace-style page list beside the live preview
// =============================================================================
// Docked to the left of the Presentation tool (components.unstable_navigator):
// a plain list of pages; click one and the preview jumps there while the edit
// panel follows (Presentation resolves the URL through resolve.mainDocuments).
// One factory, two flavors: the Public website workspace lists `page` docs,
// the Family Hub workspace lists `hubPage` docs on the gated hub preview
// route. Same card language as the Welcome pane.
// =============================================================================

interface NavRow {
  id: string;
  type: string;
  label: string;
  href: string;
}

const APIV = '2025-01-01';

// "home" lives at the preview root; everything else under its slug.
const pageHref = (slug: string) => (slug === 'home' ? '/preview' : `/preview/${slug}`);

async function fetchRows(
  client: ReturnType<typeof useClient>,
  kind: 'public' | 'hub',
): Promise<NavRow[]> {
  if (kind === 'public') {
    const docs = await client.fetch<{ _id: string; title?: string; slug?: string }[]>(
      '*[_type == "page" && defined(slug)]{ _id, title, slug } | order(title asc)',
    );
    const rows = docs
      .filter((d) => d.slug)
      .map((d) => ({
        id: d._id,
        type: 'page',
        label: d.title || d.slug!,
        href: pageHref(d.slug!),
      }));
    // Home first — it is the page people expect on top of a page list.
    rows.sort((a, b) => (a.href === '/preview' ? -1 : b.href === '/preview' ? 1 : 0));
    return rows;
  }
  const docs = await client.fetch<
    { _id: string; title?: string; heading?: string; hubKey?: string; slug?: string }[]
  >(
    '*[_type == "hubPage" && (defined(hubKey) || defined(slug))]{ _id, title, heading, hubKey, slug } | order(coalesce(title, heading) asc)',
  );
  const rows = docs
    .map((d) => ({
      id: d._id,
      type: 'hubPage',
      label: d.title || d.heading || d.hubKey || d.slug || '',
      href: `/preview/family-hub/${d.hubKey || d.slug}`,
    }))
    .filter((r) => r.label);
  rows.sort((a, b) => (a.href.endsWith('/home') ? -1 : b.href.endsWith('/home') ? 1 : 0));
  return rows;
}

export function makePreviewNavigator(kind: 'public' | 'hub'): ComponentType {
  return function PreviewNavigator() {
    const client = useClient({ apiVersion: APIV });
    const navigate = usePresentationNavigate();
    const params = usePresentationParams();
    const [rows, setRows] = useState<NavRow[] | null>(null);

    useEffect(() => {
      let alive = true;
      fetchRows(client, kind)
        .then((r) => alive && setRows(r))
        .catch(() => alive && setRows([]));
      return () => {
        alive = false;
      };
    }, [client]);

    // params.preview is the iframe's current URL; compare pathnames so query
    // strings never break the highlight.
    const current = (params.preview ?? '').split('?')[0];

    return (
      <Box padding={3} style={{ overflowY: 'auto', height: '100%' }}>
        <Stack space={3}>
          <Text size={1} weight="semibold" muted style={{ textTransform: 'uppercase' }}>
            {kind === 'hub' ? 'Hub pages' : 'Pages'}
          </Text>
          {rows === null ? (
            <Flex align="center" gap={2} padding={2}>
              <Spinner muted />
              <Text size={1} muted>
                Loading…
              </Text>
            </Flex>
          ) : rows.length === 0 ? (
            <Text size={1} muted>
              No pages yet.
            </Text>
          ) : (
            <Stack space={1}>
              {rows.map((r) => {
                const active = current === r.href || current.endsWith(r.href);
                return (
                  <Card
                    key={r.id}
                    as="button"
                    padding={2}
                    radius={2}
                    tone={active ? 'primary' : 'default'}
                    pressed={active}
                    style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
                    onClick={() => navigate(r.href, { type: r.type, id: r.id })}
                  >
                    <Text size={1} weight={active ? 'semibold' : 'regular'}>
                      {r.label}
                    </Text>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>
    );
  };
}
