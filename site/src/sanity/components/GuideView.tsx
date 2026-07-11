import { Badge, Box, Card, Flex, Heading, Stack, Text } from '@sanity/ui';
import type { ComponentType } from 'react';
import { guides, type DiyLevel, type GuideBlock } from '../guides/content';

// =============================================================================
// GuideView — read-only Help pane rendered inside the Studio structure
// =============================================================================
// One instance per guide (bound to a slug at structure-build time via
// makeGuideView), so there is no prop-plumbing to get wrong. Renders the typed
// guide blocks with @sanity/ui primitives.
// =============================================================================

// Inline **bold** support (the only formatting the guides use).
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function DiyBadge({ level }: { level?: DiyLevel }) {
  if (level === 'self')
    return (
      <Badge tone="positive" fontSize={1} padding={2}>
        You can do this yourself
      </Badge>
    );
  if (level === 'ask')
    return (
      <Badge tone="caution" fontSize={1} padding={2}>
        Check with {'Nathan'} first
      </Badge>
    );
  if (level === 'mixed')
    return (
      <Badge tone="primary" fontSize={1} padding={2}>
        Mostly yourself, see below
      </Badge>
    );
  return null;
}

function BlockView({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'h':
      return (
        <Heading as="h2" size={2}>
          {block.text}
        </Heading>
      );
    case 'p':
      return (
        <Text size={2} muted style={{ lineHeight: 1.6 }}>
          <RichText text={block.text} />
        </Text>
      );
    case 'steps':
      return (
        <Stack as="ol" space={3} paddingLeft={4}>
          {block.items.map((item, i) => (
            <Text as="li" key={i} size={2} style={{ lineHeight: 1.5 }}>
              <RichText text={item} />
            </Text>
          ))}
        </Stack>
      );
    case 'bullets':
      return (
        <Stack as="ul" space={3} paddingLeft={4}>
          {block.items.map((item, i) => (
            <Text as="li" key={i} size={2} style={{ lineHeight: 1.5 }}>
              <RichText text={item} />
            </Text>
          ))}
        </Stack>
      );
    case 'path':
      return (
        <Card tone="primary" padding={3} radius={2} border>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Where in the Studio
            </Text>
            <Text size={2}>{block.items.join('   →   ')}</Text>
          </Stack>
        </Card>
      );
    case 'callout':
      return (
        <Card tone={block.tone ?? 'default'} padding={3} radius={2} border>
          <Stack space={3}>
            {block.title && (
              <Text size={1} weight="semibold">
                {block.title}
              </Text>
            )}
            <Text size={2} style={{ lineHeight: 1.5 }}>
              <RichText text={block.text} />
            </Text>
          </Stack>
        </Card>
      );
    case 'seealso':
      return (
        <Text size={1} muted>
          See also: {block.items.join('  ·  ')}
        </Text>
      );
    default:
      return null;
  }
}

// Returns a component bound to one guide slug (used by structure.ts).
export function makeGuideView(slug: string): ComponentType {
  return function GuideView() {
    const guide = guides.find((g) => g.slug === slug);
    if (!guide) {
      return (
        <Box padding={4}>
          <Text>Guide not found.</Text>
        </Box>
      );
    }
    return (
      <Box padding={4}>
        <Box style={{ maxWidth: 680, margin: '0 auto' }}>
          <Flex align="center" gap={3} style={{ flexWrap: 'wrap' }}>
            <Heading as="h1" size={4}>
              {guide.title}
            </Heading>
            <DiyBadge level={guide.diy} />
          </Flex>
          <Box marginTop={3}>
            <Text size={2} muted style={{ lineHeight: 1.6 }}>
              {guide.lead}
            </Text>
          </Box>
          <Stack space={4} marginTop={5}>
            {guide.body.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </Stack>
        </Box>
      </Box>
    );
  };
}
