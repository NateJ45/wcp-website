// =============================================================================
// hub-doc.ts — document-column enhancements for the handbook pages
// =============================================================================
// Progressive enhancement over the server-rendered handbook (HubSectionedBody).
// One script owns three things so they can't race each other:
//
//   1. Heading anchors — a hover/focus-revealed link/chain icon on every doc
//      heading that links to it AND copies the full deep link to the clipboard
//      (Confluence / GitHub-docs behavior). No-JS still linkable via the TOC.
//   2. Two-level TOC — prose subheadings (h3) get stable ids and are injected
//      under their section in the "On this page" nav, so a board that adds
//      subheads to a long section gets a nested TOC for free. Section-only pages
//      are unchanged.
//   3. Scrollspy — highlights the TOC entry (section OR injected subhead) for
//      the heading you're reading. Runs after injection so it sees every link.
//
// Supersedes the old hub-toc.ts (scrollspy only). Imported once from
// HubSectionedBody, so it runs on every handbook page (with or without a TOC).
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const OFFSET = 140; // px from viewport top: a heading above this line is "read"

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '');
  return base || 'section';
}

onPageLoad(() => {
  const prose = document.querySelector<HTMLElement>('.hub-prose');
  const nav = document.querySelector<HTMLElement>('[data-hub-toc]');

  if (prose) enhance(prose, nav);
  if (nav) scrollspy(nav);
});

// ---- 1 + 2: ids, anchors, and injected sub-entries -------------------------
function enhance(prose: HTMLElement, nav: HTMLElement | null): void {
  const used = new Set<string>();
  document.querySelectorAll<HTMLElement>('[id]').forEach((el) => el.id && used.add(el.id));
  const uniqueId = (base: string): string => {
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  };

  prose.querySelectorAll<HTMLElement>('.hub-doc-block').forEach((block) => {
    // The section's own title (SectionHeader already gave it id="sec-…").
    const title = block.querySelector<HTMLElement>('.wcp-section-header > :is(h2, h3)');
    // Subheadings a board added inside the prose body (no ids yet).
    const subheads = [...block.querySelectorAll<HTMLElement>('.wcp-prose :is(h3, h4)')];

    // Assign ids + capture labels BEFORE adding anchors (anchors mutate text).
    const labelled: Array<{ el: HTMLElement; label: string }> = [];
    for (const h of [title, ...subheads]) {
      if (!h) continue;
      const label = (h.textContent || '').trim();
      if (!h.id) h.id = uniqueId(`h-${slugify(label)}`);
      labelled.push({ el: h, label });
    }

    // Inject the subheads as level-2 TOC entries under the section entry.
    if (nav && title?.id && subheads.length) {
      injectSubentries(
        nav,
        title.id,
        subheads.map((el) => ({ id: el.id, label: (el.textContent || '').trim() })),
      );
    }

    // Add the copy-link anchor to every heading (done last).
    for (const { el, label } of labelled) addAnchor(el, label);
  });
}

const SVG_NS = 'http://www.w3.org/2000/svg';
/** A small link/chain icon (lucide "link-2"), built with DOM APIs. */
function linkIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M9 17H7A5 5 0 0 1 7 7h2', 'M15 7h2a5 5 0 1 1 0 10h-2']) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
  }
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', '8');
  line.setAttribute('x2', '16');
  line.setAttribute('y1', '12');
  line.setAttribute('y2', '12');
  svg.appendChild(line);
  return svg;
}

function addAnchor(heading: HTMLElement, label: string): void {
  if (heading.querySelector('.hub-anchor')) return;
  const a = document.createElement('a');
  a.className = 'hub-anchor';
  a.href = `#${heading.id}`;
  a.setAttribute('aria-label', `Copy link to “${label}”`);
  // A small link/chain glyph (lucide "link-2") reads as "copy link" — a bare
  // "#" looked like stray punctuation beside the title. Built via DOM from a
  // static shape (no user content), so there's no injection surface.
  a.appendChild(linkIcon());
  a.addEventListener('click', () => {
    // Let the default jump update the hash; also copy the absolute deep link.
    const url = `${location.origin}${location.pathname}#${heading.id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        a.dataset.copied = 'true';
        window.setTimeout(() => delete a.dataset.copied, 1400);
      })
      .catch(() => {});
  });
  heading.appendChild(a);
}

function injectSubentries(
  nav: HTMLElement,
  parentId: string,
  subs: Array<{ id: string; label: string }>,
): void {
  const parentLink = nav.querySelector<HTMLElement>(`[data-toc-link="${parentId}"]`);
  const parentLi = parentLink?.closest('li');
  if (!parentLi) return;
  let sublist = parentLi.querySelector<HTMLElement>('.hub-toc-sub');
  if (!sublist) {
    sublist = document.createElement('ul');
    sublist.className = 'hub-toc-sub';
    parentLi.appendChild(sublist);
  }
  for (const { id, label } of subs) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'hub-toc-link hub-toc-link-sub';
    a.href = `#${id}`;
    a.setAttribute('data-toc-link', id);
    a.textContent = label;
    li.appendChild(a);
    sublist.appendChild(li);
  }
}

// ---- 3: scrollspy (was hub-toc.ts) -----------------------------------------
function scrollspy(nav: HTMLElement): void {
  const links = new Map<string, HTMLElement>();
  nav.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((a) => {
    const id = a.getAttribute('data-toc-link');
    if (id) links.set(id, a);
  });

  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));
  if (!sections.length) return;
  // Document order, so `pick()` (last heading above the line) is correct even
  // with injected subheads interleaved between section titles.
  sections.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );

  let active = '';
  const setActive = (id: string) => {
    if (id === active) return;
    active = id;
    links.forEach((a, key) => {
      const on = key === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  const pick = () => {
    // Near the page bottom, the LAST section wins. A short final section or a
    // tall trailing band (e.g. the CTA under the FAQ) can stop the last heading
    // from ever reaching the offset line, which otherwise strands the highlight
    // one section back once you've read to the end. Use the scrolling element
    // (not window.scrollY) so it's correct regardless of the scroll container.
    const se = document.scrollingElement || document.documentElement;
    if (se.scrollTop + se.clientHeight >= se.scrollHeight - 80) {
      return sections[sections.length - 1].id;
    }
    // Activate a heading once it's ~30% down the viewport (sooner than only at
    // the very top), with OFFSET as the floor on short screens.
    const line = Math.max(OFFSET, Math.round(window.innerHeight * 0.3));
    let current = sections[0].id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= line) current = s.id;
      else break;
    }
    return current;
  };

  let pinned = '';
  let pinTimer = 0;
  const unpin = () => {
    if (!pinned) return;
    // The click's scroll has settled: keep the section the user CLICKED active,
    // rather than re-running pick(). On a short page the clicked heading may not
    // reach the offset line (nothing left to scroll), and pick() would then land
    // on the PREVIOUS section — the "highlights one section up" bug. Release the
    // pin so the user's own next scroll drives pick() normally from here.
    setActive(pinned);
    pinned = '';
    clearTimeout(pinTimer);
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    setActive(pinned || pick());
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  nav.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-toc-link]');
    const id = link?.getAttribute('data-toc-link');
    if (!id || !links.has(id)) return;
    pinned = id;
    setActive(id);
    clearTimeout(pinTimer);
    pinTimer = window.setTimeout(unpin, 1000);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('scrollend', unpin, { passive: true });
  update();
}
