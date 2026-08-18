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
import { formatEventWhen, eventPlace, googleCalendarUrl, type EventDoc } from '@/lib/events';
import { parseVideo } from '@/lib/embeds';
import {
  imageUrl,
  imageSrcSet,
  fileUrlFromRef,
  type SanityImageSource,
  type SanityImageValue,
} from '@/lib/image';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// House style bans em-dashes (the #1 AI tell). Most hub prose is Board-editable
// Sanity content that can't be re-seeded while writes are quota-blocked, so we
// strip em-dashes at render time as a safety net: a numeric range becomes an
// en-dash (allowed), everything else (the parenthetical em-dash) becomes a
// comma. Applied to every portable-text render below; also exported for the
// plain-string fields (card bodies) that don't go through Portable Text. Once
// the Studio content itself is em-dash-free this is a harmless no-op.
export function deEmDash(text: string): string {
  return text
    .replace(/(\d)\s*—\s*(\d)/g, '$1–$2')
    .replace(/\s*—\s*/g, ', ')
    .replace(/,\s*,/g, ',');
}

// Board-pasted plain-string fields (update excerpts, pasted from HTML email)
// can carry literal entities — "trip to&nbsp;Niedermann Family Farm" rendered
// the raw "&nbsp;" on the Updates cards (2026-07-16 audit). Decode the handful
// that show up in prose before rendering as text. Like deEmDash, a no-op once
// the Studio content itself is clean.
export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Deep variant: strip em-dashes from every string in an object/array (section
// headers, step descriptions, schedule text, page intros — the plain-string
// fields that don't flow through Portable Text). Returns a cleaned clone; keys
// and non-content strings (hrefs, _type) never contain em-dashes, so it's a
// no-op there. Preserves stega characters (only the em-dash glyph is touched).
export function deEmDashDeep<T>(value: T): T {
  if (typeof value === 'string') return deEmDash(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => deEmDashDeep(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deEmDashDeep(v);
    return out as T;
  }
  return value;
}

function stripEmDashBlocks(blocks: PortableTextBlock[]): PortableTextBlock[] {
  return blocks.map((block) =>
    Array.isArray(block.children)
      ? {
          ...block,
          children: block.children.map((child) =>
            typeof child.text === 'string' ? { ...child, text: deEmDash(child.text) } : child,
          ),
        }
      : block,
  );
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
  const prepared = stripEmDashBlocks(
    options.normalizeHeadings ? normalizeHeadingLevels(blocks) : blocks,
  );
  return toHTML(prepared, { components: { marks: linkMark(linkBase) } });
}

// Plain-text flattening for machine consumers (FAQPage JSON-LD wants the
// answer as text, not markup). Blocks join with a blank line; non-text blocks
// (images) are skipped.
export function portableTextToPlain(blocks: PortableTextBlock[] | undefined): string {
  if (!blocks || blocks.length === 0) return '';
  return blocks
    .map((b) =>
      Array.isArray(b.children)
        ? b.children.map((c) => (typeof c.text === 'string' ? deEmDash(c.text) : '')).join('')
        : '',
    )
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

// Like renderPortableText, but also renders the inline images a `postBody`
// allows (a blog post is the one place a volunteer drops photos mid-article).
// Images come off Sanity's CDN via imageUrl/imageSrcSet with a required alt and
// an optional caption rendered as a <figcaption>.
export function renderPostBody(blocks: PortableTextBlock[] | undefined, linkBase = ''): string {
  if (!blocks || blocks.length === 0) return '';
  // A post body is always the whole article under the page <h1>, so normalize
  // its heading levels unconditionally (no-op for correctly-authored h2/h3).
  const normalized = stripEmDashBlocks(normalizeHeadingLevels(blocks));
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
      // A video renders as the site-wide click-to-load facade: thumbnail +
      // play button now, the iframe only after a tap (scripts/embeds wires
      // [data-embed-video] — the pages that render bodies import it).
      videoEmbed: ({ value }) => {
        const v = value as { url?: string; title?: string };
        const video = parseVideo(v?.url);
        if (!video.embedUrl) return '';
        const title = escapeAttr(v?.title?.trim() || 'Video');
        const thumb = video.thumbnailUrl
          ? `<img src="${escapeAttr(video.thumbnailUrl)}" alt="" class="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />`
          : '';
        return (
          `<div class="wcp-embed not-prose relative aspect-video overflow-hidden rounded-2xl bg-navy" data-embed-video="${escapeAttr(video.embedUrl)}" data-embed-title="${title}">` +
          `<button type="button" class="wcp-embed-play group absolute inset-0 flex h-full w-full items-center justify-center" aria-label="Play video: ${title}">` +
          thumb +
          `<span class="absolute inset-0 bg-navy/25 transition-colors group-hover:bg-navy/10"></span>` +
          `<span class="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-105">` +
          `<svg class="ml-1 h-7 w-7 text-navy" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>` +
          `</span></button></div>`
        );
      },
      // A gallery renders as a simple two-column grid of figures. The big
      // pinned-print look stays reserved for the photo wall; a post gallery is
      // quiet by design.
      postGallery: ({ value }) => {
        const v = value as { images?: (SanityImageValue & { caption?: string })[] };
        const figures = (v?.images ?? [])
          .filter((img) => img?.asset)
          .map((img) => {
            const alt = escapeAttr(typeof img.alt === 'string' ? img.alt : '');
            const src = imageUrl(img as SanityImageSource, 600);
            const srcset = imageSrcSet(img as SanityImageSource, [400, 600, 900]);
            const cap = img.caption
              ? `<figcaption class="mt-1 text-center text-sm text-ink-muted">${escapeAttr(deEmDash(img.caption))}</figcaption>`
              : '';
            return `<figure class="m-0"><img src="${escapeAttr(src)}" srcset="${escapeAttr(srcset)}" sizes="(max-width: 640px) 50vw, 320px" alt="${alt}" loading="lazy" decoding="async" class="aspect-[4/3] w-full rounded-xl object-cover" />${cap}</figure>`;
          })
          .join('');
        if (!figures) return '';
        return `<div class="not-prose grid grid-cols-2 gap-3">${figures}</div>`;
      },
      // An attachment renders as a download card: paperclip, the Board's own
      // label, and the file extension so nobody taps a mystery. The URL comes
      // straight from the asset ref (fileUrlFromRef), so the query needs no
      // dereference. A row with no valid file renders nothing.
      // A callout renders with the same look as the site-wide Callout.astro
      // (sky = info, warm = important). Line breaks in the textarea survive
      // as <br>.
      calloutBlock: ({ value }) => {
        const v = value as { tone?: string; text?: string };
        const text = typeof v?.text === 'string' ? v.text.trim() : '';
        if (!text) return '';
        const toneClass =
          v?.tone === 'warm' ? 'border-orange/25 bg-cream' : 'border-sky/30 bg-sky-soft';
        const body = escapeAttr(deEmDash(text)).replace(/\n/g, '<br />');
        return `<div class="not-prose wcp-callout rounded-[var(--radius)] border p-5 ${toneClass}"><div class="leading-relaxed text-ink">${body}</div></div>`;
      },
      // The one brand button (the amber pill the site CTAs use). External
      // links open a new tab; site links pass through withBase so preview
      // stays inside /preview/*.
      buttonBlock: ({ value }) => {
        const v = value as { label?: string; url?: string };
        const label = typeof v?.label === 'string' ? v.label.trim() : '';
        const raw = typeof v?.url === 'string' ? v.url.trim() : '';
        if (!label || !raw) return '';
        const href = withBase(raw, linkBase);
        const external = /^https?:\/\//.test(href);
        const rel = external ? ' target="_blank" rel="noopener"' : '';
        return (
          `<p class="not-prose"><a href="${escapeAttr(href)}"${rel} ` +
          `class="wcp-press inline-flex min-h-12 items-center rounded-full bg-amber px-6 font-bold text-[#01203a] no-underline shadow-md">` +
          `${escapeAttr(deEmDash(label))}</a></p>`
        );
      },
      // A sign-up card links to the hub sign-ups page and shows whether the
      // sheet is open. The status label stays neutral text (a colored dot
      // carries the color) — the dark-mode AA rule for tinted text.
      signupCard: ({ value }) => {
        const v = value as { sheet?: { _id?: string; title?: string; open?: boolean } | null };
        const title = typeof v?.sheet?.title === 'string' ? v.sheet.title.trim() : '';
        if (!title) return '';
        const open = v.sheet?.open !== false;
        const href = withBase('/family-hub/sign-ups', linkBase);
        const dot = open ? 'bg-green' : 'bg-border';
        const status = open ? 'Open' : 'Closed';
        return (
          `<p class="not-prose"><a href="${escapeAttr(href)}" ` +
          `class="flex max-w-full items-center gap-3 rounded-[var(--radius)] border border-border bg-grey/60 px-4 py-3 no-underline hover:border-navy dark:bg-white/5">` +
          `<svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0 text-sky-ink" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>` +
          `<span class="min-w-0 flex-1"><span class="block truncate font-bold text-heading">${escapeAttr(deEmDash(title))}</span>` +
          `<span class="block text-sm text-ink-muted">Sign-up sheet</span></span>` +
          `<span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-ink-muted dark:bg-surface">` +
          `<span class="h-2 w-2 rounded-full ${dot}" aria-hidden="true"></span>${status}</span></a></p>`
        );
      },
      // An event card shows when and where, plus both add-to-calendar paths:
      // the Google template URL and the .ics download (/api/event-ics).
      eventCard: ({ value }) => {
        const v = value as { event?: (EventDoc & { _id?: string }) | null };
        const e = v?.event;
        if (!e?.title || !e.startDate) return '';
        const when = formatEventWhen(e);
        const place = eventPlace(e);
        const gcal = googleCalendarUrl(e);
        const ics = withBase(`/api/event-ics?id=${encodeURIComponent(e._id ?? '')}`, linkBase);
        return (
          `<div class="not-prose rounded-[var(--radius)] border border-border bg-grey/60 p-4 dark:bg-white/5">` +
          `<p class="font-bold text-heading">${escapeAttr(deEmDash(e.title))}</p>` +
          `<p class="mt-1 text-sm text-ink">${escapeAttr(when)}</p>` +
          (place ? `<p class="text-sm text-ink-muted">${escapeAttr(deEmDash(place))}</p>` : '') +
          `<p class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">` +
          `<a href="${escapeAttr(gcal)}" target="_blank" rel="noopener" class="text-sky-ink underline">Add to Google Calendar</a>` +
          `<a href="${escapeAttr(ics)}" class="text-sky-ink underline">Download .ics</a></p></div>`
        );
      },
      // A table scrolls inside its own container (the site-wide wide-content
      // rule) so the page body never scrolls sideways.
      tableBlock: ({ value }) => {
        const v = value as { headerRow?: boolean; rows?: { cells?: string[] }[] };
        const rows = (v?.rows ?? []).filter((r) => (r?.cells ?? []).some((c) => c?.trim()));
        if (!rows.length) return '';
        const header = v?.headerRow !== false;
        const cell = (text: string, th: boolean) =>
          th
            ? `<th scope="col" class="border-b-2 border-border px-3 py-2 font-bold text-heading">${escapeAttr(deEmDash(text))}</th>`
            : `<td class="border-b border-border px-3 py-2 align-top text-ink">${escapeAttr(deEmDash(text))}</td>`;
        const bodyRows = header ? rows.slice(1) : rows;
        const thead = header
          ? `<thead><tr>${(rows[0]?.cells ?? []).map((c) => cell(c ?? '', true)).join('')}</tr></thead>`
          : '';
        const tbody = `<tbody>${bodyRows
          .map((r) => `<tr>${(r.cells ?? []).map((c) => cell(c ?? '', false)).join('')}</tr>`)
          .join('')}</tbody>`;
        return `<div class="not-prose overflow-x-auto"><table class="w-full min-w-[24rem] border-collapse text-left text-sm">${thead}${tbody}</table></div>`;
      },
      // Two columns of the constrained rich text, side by side. Phones stack
      // them (the grid collapses below md). No not-prose here on purpose —
      // the nested blocks keep the article's prose styling. Headings inside a
      // column normalize like the article's own: a column that starts at h3
      // would otherwise skip a level under the page <h1> (WCAG heading-order).
      twoColumns: ({ value }) => {
        const v = value as { left?: PortableTextBlock[]; right?: PortableTextBlock[] };
        const left = renderPortableText(v?.left, linkBase, { normalizeHeadings: true });
        const right = renderPortableText(v?.right, linkBase, { normalizeHeadings: true });
        if (!left && !right) return '';
        return `<div class="grid gap-x-8 gap-y-4 md:grid-cols-2"><div>${left}</div><div>${right}</div></div>`;
      },
      fileAttachment: ({ value }) => {
        const v = value as { title?: string; file?: { asset?: { _ref?: string } } };
        const href = fileUrlFromRef(v?.file?.asset?._ref);
        const title = typeof v?.title === 'string' ? v.title.trim() : '';
        if (!href || !title) return '';
        const ext = (href.split('.').pop() ?? '').toUpperCase();
        return (
          `<p class="not-prose"><a href="${escapeAttr(href)}" target="_blank" rel="noopener" download ` +
          `class="inline-flex max-w-full items-center gap-2.5 rounded-[var(--radius)] border border-border bg-grey/60 px-4 py-3 font-bold text-heading no-underline hover:border-navy dark:bg-white/5">` +
          `<svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0 text-sky-ink" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>` +
          `<span class="min-w-0 truncate">${escapeAttr(deEmDash(title))}</span>` +
          (ext
            ? `<span class="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-muted dark:bg-surface">${escapeAttr(ext)}</span>`
            : '') +
          `</a></p>`
        );
      },
    },
  };
  return toHTML(normalized, { components });
}
