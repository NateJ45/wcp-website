// =============================================================================
// Portable Text → HTML (for richProse / inlineText fields)
// =============================================================================
// Renders the constrained rich text our schema allows (h2/h3/lists/bold/
// italic/links) to an HTML string, dropped into the existing Prose.astro
// styling with set:html. Link hrefs run through withBase() so in-preview links
// stay inside /preview/*. Stega-encoded characters in text nodes pass through
// untouched, so click-to-edit still works.
// =============================================================================
import { toHTML, type PortableTextHtmlComponents } from '@portabletext/to-html';
import type { PortableTextBlock } from '@portabletext/types';
import { withBase } from '@/lib/utils';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function renderPortableText(blocks: PortableTextBlock[] | undefined, linkBase = ''): string {
  if (!blocks || blocks.length === 0) return '';
  const components: Partial<PortableTextHtmlComponents> = {
    marks: {
      link: ({ children, value }) => {
        const raw = typeof value?.href === 'string' ? value.href : '#';
        const href = withBase(raw, linkBase);
        const external = /^https?:\/\//.test(href);
        const rel = external ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${escapeAttr(href)}"${rel}>${children}</a>`;
      },
    },
  };
  return toHTML(blocks, { components });
}
