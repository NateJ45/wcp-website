// ============================================================================
// social-lightbox — in-page viewer for the "Life inside WCP" photo wall
// ============================================================================
// Progressive enhancement over SocialWallWidget: each tile is a real link to
// its Instagram post (works with no JS). When JS is on, clicking a tile opens
// a native <dialog> viewer showing the FULL, uncropped image + caption instead
// — so the designed posts (playdate schedules, teacher thank-yous) are readable
// and reels are clearly videos, without leaving the hub. The dialog gives Esc,
// focus trapping, and top-layer stacking for free; we add prev/next, arrow
// keys, and backdrop-click to close. Old browsers without showModal simply keep
// the plain links.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

function setup() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-wall-lightbox]');
  const items = [...document.querySelectorAll<HTMLElement>('[data-wall-item]')];
  if (!dialog || typeof dialog.showModal !== 'function' || items.length === 0) return;

  const imgEl = dialog.querySelector<HTMLImageElement>('[data-wall-lb-img]');
  const playEl = dialog.querySelector<HTMLElement>('[data-wall-lb-play]');
  const capEl = dialog.querySelector<HTMLElement>('[data-wall-lb-caption]');
  const linkEl = dialog.querySelector<HTMLAnchorElement>('[data-wall-lb-link]');
  const linkText = dialog.querySelector<HTMLElement>('[data-wall-lb-linktext]');
  if (!imgEl || !capEl || !linkEl || !linkText) return;

  let idx = 0;

  const show = (i: number) => {
    idx = (i + items.length) % items.length;
    const el = items[idx];
    const caption = el.dataset.caption || '';
    const isVideo = el.dataset.video === 'true';
    imgEl.src = el.dataset.full || '';
    // Empty alt when the caption is shown below (the figcaption is the text
    // alternative) — avoids duplicating it; a generic alt only when captionless.
    imgEl.alt = caption ? '' : 'A moment from West Chester Preschool';
    capEl.textContent = caption;
    capEl.hidden = caption.length === 0;
    if (playEl) playEl.hidden = !isVideo;
    linkEl.href = el.dataset.href || linkEl.href;
    linkText.textContent = isVideo ? 'Watch on Instagram' : 'View on Instagram';
  };

  items.forEach((el, i) => {
    el.addEventListener('click', (e) => {
      // Let modified clicks (new tab, etc.) follow the real link.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      show(i);
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-wall-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-wall-prev]')?.addEventListener('click', () => show(idx - 1));
  dialog.querySelector('[data-wall-next]')?.addEventListener('click', () => show(idx + 1));

  // Click the backdrop (the dialog area outside its content) to close.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      show(idx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      show(idx + 1);
    }
  });
}

onPageLoad(setup);

export {};
