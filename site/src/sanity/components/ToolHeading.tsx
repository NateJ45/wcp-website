import type { ReactNode } from 'react';
import { Flex, Heading } from '@sanity/ui';
import emblem from '../../assets/brand/wcp-emblem.png';

// =============================================================================
// ToolHeading — the ONE header for the custom Studio tools
// =============================================================================
// Every custom tool (Welcome, Checkup, Clean up, Export, Start of year, Site
// stats) opens with the same brand moment: the sun+cloud emblem beside a
// Captain Comic heading. One component, so the tools stay a family and a
// future tool gets the look for free. The emblem is decorative (alt="").
// =============================================================================

const emblemSrc: string = typeof emblem === 'string' ? emblem : emblem.src;

export function ToolHeading({ children }: { children: ReactNode }) {
  return (
    <Flex align="center" gap={3}>
      <img
        src={emblemSrc}
        alt=""
        style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }}
      />
      <Heading size={3} className="wcp-display">
        {children}
      </Heading>
    </Flex>
  );
}
