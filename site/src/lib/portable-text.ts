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

export function renderPortableText(blocks: PortableTextBlock[] | undefined, linkBase = ''): string {
  if (!blocks || blocks.length === 0) return '';
  return toHTML(blocks, { components: { marks: linkMark(linkBase) } });
}

// Like renderPortableText, but also renders the inline images a `postBody`
// allows (a blog post is the one place a volunteer drops photos mid-article).
// Images come off Sanity's CDN via imageUrl/imageSrcSet with a required alt and
// an optional caption rendered as a <figcaption>.
export function renderPostBody(blocks: PortableTextBlock[] | undefined, linkBase = ''): string {
  if (!blocks || blocks.length === 0) return '';
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
  return toHTML(blocks, { components });
}
