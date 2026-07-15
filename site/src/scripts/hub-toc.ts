// =============================================================================
// hub-toc.ts — scrollspy for the sticky "on this page" TOC (HubSectionIndex)
// =============================================================================
// Highlights the TOC link for the section you're currently reading. Uses a
// scroll-position check (not an IntersectionObserver band): the section headings
// are short and far apart, so a band approach misses the stretches between them
// and never advances on an anchor jump. Instead, on each scroll we pick the LAST
// heading that has passed the offset line near the top — deterministic at any
// scroll position, including instant jumps. Runs once per document (onPageLoad);
// the TOC is `hidden xl:block`, so on phones this finds no nav and returns.
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const OFFSET = 140; // px from viewport top: a heading above this line is "read"

onPageLoad(() => {
  const nav = document.querySelector<HTMLElement>('[data-hub-toc]');
  if (!nav) return;

  const links = new Map<string, HTMLElement>();
  nav.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((a) => {
    const id = a.getAttribute('data-toc-link');
    if (id) links.set(id, a);
  });

  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));
  if (!sections.length) return;

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

  let ticking = false;
  const update = () => {
    ticking = false;
    let current = sections[0].id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= OFFSET) current = s.id;
      else break;
    }
    setActive(current);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  // Native cross-document view transitions mean each navigation is a fresh
  // document, so these listeners don't accumulate across hub pages.
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
});
