// =============================================================================
// hub-doc.ts — document-column enhancements for the handbook pages
// =============================================================================
// Progressive enhancement over the server-rendered handbook (HubSectionedBody).
// One script owns three things so they can't race each other:
//
//   1. Heading anchors — a hover/focus-revealed "#" on every doc heading that
//      links to it AND copies the full deep link to the clipboard (Confluence /
//      GitHub-docs behavior). No-JS still linkable via the TOC.
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

function addAnchor(heading: HTMLElement, label: string): void {
  if (heading.querySelector('.hub-anchor')) return;
  const a = document.createElement('a');
  a.className = 'hub-anchor';
  a.href = `#${heading.id}`;
  a.setAttribute('aria-label', `Copy link to “${label}”`);
  a.textContent = '#';
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
    let current = sections[0].id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= OFFSET) current = s.id;
      else break;
    }
    return current;
  };

  let pinned = '';
  let pinTimer = 0;
  const unpin = () => {
    if (!pinned) return;
    pinned = '';
    clearTimeout(pinTimer);
    setActive(pick());
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
