import { useFormValue } from 'sanity';
import { Box, Card, Flex, Stack, Text } from '@sanity/ui';
import { projectId, dataset } from '../env';

// =============================================================================
// SeoSnippetInput — the live snippet preview at the top of "Search & sharing"
// =============================================================================
// A custom INPUT for the value-less `seoPreview` field (see
// schemaTypes/objects/seoFields.ts). It draws two pictures of the same page:
//  1. the Google result (address, blue title, grey sentence), and
//  2. the social share card (picture, title, sentence).
// Both update as the editor types, so the effect of an SEO field is visible in
// the same panel that sets it.
//
// This is an INPUT, so useFormValue is allowed: an input always renders inside
// the document form, which provides the FormValueProvider. A standalone document
// VIEW (SeoPreviewPane) may not call it — inside the Presentation tool there is
// no provider, the hook throws, and the thrown error freezes the whole panel.
// Keep that split.
//
// No new dependencies: @sanity/ui primitives only, and the share picture URL is
// assembled from the asset id by hand (the same shape @sanity/image-url emits).
// =============================================================================

const DOMAIN = 'westchesterpreschool.org';
const GOOGLE_TITLE_MAX = 60;
const GOOGLE_DESC_MAX = 160;

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Build a CDN url from an image asset reference.
 * A reference reads "image-<id>-<width>x<height>-<ext>"; the file it points at
 * is "<id>-<width>x<height>.<ext>". Anything else returns null.
 */
function assetUrl(value: unknown): string | null {
  const ref = (value as { asset?: { _ref?: string } } | undefined)?.asset?._ref;
  if (typeof ref !== 'string') return null;
  const parts = ref.split('-');
  if (parts.length < 4 || parts[0] !== 'image') return null;
  const ext = parts[parts.length - 1];
  const body = parts.slice(1, -1).join('-');
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${body}.${ext}?w=600&fit=crop`;
}

export function SeoSnippetInput() {
  // The whole document, live. An empty path reads the document root.
  const doc = (useFormValue([]) ?? {}) as Record<string, unknown>;

  const slug = str(doc.slug);
  const title = str(doc.seoTitle) || str(doc.title) || 'Untitled page';
  const description =
    str(doc.seoDescription) ||
    str(doc.excerpt) ||
    'No description yet. Add one so search results and shared links read well.';
  const hidden = doc.hideFromSearch === true;
  const shareImage = assetUrl(doc.ogImage) ?? assetUrl(doc.seoImage);
  const prettyUrl = `${DOMAIN}${!slug || slug === 'home' ? '' : `/${slug}`}`;

  return (
    <Stack space={3}>
      {hidden && (
        <Card padding={3} radius={2} tone="caution" border>
          <Text size={1}>
            This page is set to stay out of Google, so the result below will not appear in search.
            Shared links still look like the card below.
          </Text>
        </Card>
      )}

      {/* Google result */}
      <Card padding={3} radius={2} border>
        <Stack space={2}>
          <Text size={0} muted>
            In Google
          </Text>
          <Text size={1} style={{ color: '#5f6368' }}>
            {prettyUrl}
          </Text>
          <Text size={2} weight="medium" style={{ color: '#1a0dab' }}>
            {clamp(title, GOOGLE_TITLE_MAX)}
          </Text>
          <Text size={1} style={{ color: '#4d5156', lineHeight: 1.5 }}>
            {clamp(description, GOOGLE_DESC_MAX)}
          </Text>
        </Stack>
      </Card>

      {/* Social share card */}
      <Card radius={2} overflow="hidden" border>
        <Box
          style={{
            height: 140,
            background: shareImage
              ? `center / cover no-repeat url(${JSON.stringify(shareImage)})`
              : 'linear-gradient(135deg,#01457E,#40aaed)',
          }}
        >
          {!shareImage && (
            <Flex align="center" justify="center" style={{ height: '100%' }}>
              <Text size={1} style={{ color: 'rgba(255,255,255,0.85)' }}>
                The usual share card
              </Text>
            </Flex>
          )}
        </Box>
        <Card padding={3} tone="transparent" style={{ background: '#f2f3f5' }}>
          <Stack space={2}>
            <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {DOMAIN}
            </Text>
            <Text size={1} weight="semibold" style={{ color: '#1a1a1a' }}>
              {clamp(title, 70)}
            </Text>
            <Text size={1} style={{ color: '#4d5156' }}>
              {clamp(description, 120)}
            </Text>
          </Stack>
        </Card>
      </Card>
    </Stack>
  );
}
