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
import { imageUrl, imageSrcSet, type SanityImageSource, type SanityImageValue } from '@/lib/image';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const HEADING_STYLE = /^h([1-6])$/;

// Normalize the heading levels of a body that renders directly under the page
// <h1>, so it can never trip WCAG "heading-order" (a jump like h1 -> h3).
//
// Our schemas hand the board only two heading styles, and blockContent's top
// one is h3 ("Heading") / h4 ("Subheading") — fine when a body sits under a
// section's own <h2>, but a skip when it's the whole article (hub update detail,
// news post). Rather than bake context into the schema or the migration, we fix
// it at render time for exactly those article renders.
//
// Dense-rank the distinct heading levels present: smallest -> h2, next -> h3,
// and so on (capped at h6). That lands the top body heading at h2 directly under
// the page h1, preserves the relative order, and — unlike a fixed offset — can
// never leave a gap, for any input. With our two adjacent levels it's just
// h3/h4 -> h2/h3; correctly-authored h2/h3 bodies are untouched.
function normalizeHeadingLevels(blocks: PortableTextBlock[]): PortableTextBlock[] {
  const present = new Set<number>();
  for (const block of blocks) {
    const match = typeof block.style === 'string' ? block.style.match(HEADING_STYLE) : null;
    if (match) present.add(Number(match[1]));
  }
  if (present.size === 0) return blocks;

  const remap = new Map<number, number>();
  [...present].sort((a, b) => a - b).forEach((level, i) => remap.set(level, Math.min(2 + i, 6)));

  return blocks.map((block) => {
    const match = typeof block.style === 'string' ? block.style.match(HEADING_STYLE) : null;
    if (!match) return block;
    return { ...block, style: `h${remap.get(Number(match[1]))}` };
  });
}

function linkMark(linkBase: string): Partial<PortableTextHtmlComponents>['marks'] {
  return {
    link: ({ children, value }) => {
      const raw = typeof value?.href === 'string' ? value.href : '#';
      const href = withBase(raw, linkBase);
      const external = /^https?:\/\//.test(href);
      const rel = external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escapeAttr(href)}"${rel}>${children}</a>`;
    },
  };
}

// `normalizeHeadings` is opt-in because most callers embed this body as a
// fragment under a section's own <h2> (FAQ answers, callouts, tab panels, class
// notes, ...), where h3/h4 is the CORRECT level and promoting to h2 would break
// the page outline. Pass it only when the body is the article itself, rendered
// directly under the page <h1> (see the hub update detail page).
export function renderPortableText(
  blocks: PortableTextBlock[] | undefined,
  linkBase = '',
  options: { normalizeHeadings?: boolean } = {},
): string {
  if (!blocks || blocks.length === 0) return '';
  const prepared = options.normalizeHeadings ? normalizeHeadingLevels(blocks) : blocks;
  return toHTML(prepared, { components: { marks: linkMark(linkBase) } });
}

// Like renderPortableText, but also renders the inline images a `postBody`
// allows (a blog post is the one place a volunteer drops photos mid-article).
// Images come off Sanity's CDN via imageUrl/imageSrcSet with a required alt and
// an optional caption rendered as a <figcaption>.
export function renderPostBody(blocks: PortableTextBlock[] | undefined, linkBase = ''): string {
  if (!blocks || blocks.length === 0) return '';
  // A post body is always the whole article under the page <h1>, so normalize
  // its heading levels unconditionally (no-op for correctly-authored h2/h3).
  const normalized = normalizeHeadingLevels(blocks);
  const components: Partial<PortableTextHtmlComponents> = {
    marks: linkMark(linkBase),
    types: {
      image: ({ value }) => {
        const source = value as SanityImageValue;
        if (!source?.asset) return '';
        const alt = escapeAttr(typeof source.alt === 'string' ? source.alt : '');
        const src = imageUrl(source as SanityImageSource, 800);
        const srcset = imageSrcSet(source as SanityImageSource, [400, 800, 1200]);
        const caption = source.caption
          ? `<figcaption>${escapeAttr(source.caption)}</figcaption>`
          : '';
        return `<figure><img src="${escapeAttr(src)}" srcset="${escapeAttr(srcset)}" sizes="(max-width: 768px) 100vw, 768px" alt="${alt}" loading="lazy" decoding="async" />${caption}</figure>`;
      },
    },
  };
  return toHTML(normalized, { components });
}
