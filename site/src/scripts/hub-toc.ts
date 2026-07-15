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
//
// Clicking a link is treated as authoritative. With `scroll-behavior: smooth`
// the target heading only crosses the offset line on the LAST frame of the
// jump animation, and the rAF-throttled scroll handler usually reads a frame
// just before that — which would leave the PREVIOUS heading highlighted and
// never self-correct (no scroll event fires once the animation rests). So on
// click we pin the clicked target immediately and release the pin the moment
// the smooth scroll settles (`scrollend`, with a timeout fallback), after which
// the at-rest scroll check takes over (and agrees).
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

  // The section the scroll position points at: the last heading above the line.
  const pick = () => {
    let current = sections[0].id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= OFFSET) current = s.id;
      else break;
    }
    return current;
  };

  // While a click-initiated smooth scroll is in flight, the clicked target
  // wins; scroll-driven updates would otherwise land on the previous heading.
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
    // Fallback release for browsers without `scrollend` (older Safari): a bit
    // longer than a typical smooth-scroll so the pin outlasts the animation.
    pinTimer = window.setTimeout(unpin, 1000);
  });

  // Native cross-document view transitions mean each navigation is a fresh
  // document, so these listeners don't accumulate across hub pages.
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('scrollend', unpin, { passive: true });
  update();
});
