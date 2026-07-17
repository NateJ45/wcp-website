// ============================================================================
// social-lightbox — in-page viewer for the "Life inside WCP" photo wall
// ============================================================================
// Progressive enhancement over SocialWallWidget: each tile is a real link to
// its Instagram post (works with no JS). When JS is on, clicking a tile opens
// a native <dialog> viewer showing the FULL, uncropped image + caption instead
// — so the designed posts (playdate schedules, teacher thank-yous) are readable
// without leaving the hub. VIDEO posts play INLINE in a <video> (poster = the
// still); if the Instagram CDN's signed video URL has expired we fall back to
// the poster + play badge and the "Watch on Instagram" link. The dialog gives
// Esc, focus trapping, and top-layer stacking for free; we add prev/next, arrow
// keys, and backdrop-click to close. Old browsers without showModal keep the
// plain links.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

function setup() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-wall-lightbox]');
  const items = [...document.querySelectorAll<HTMLElement>('[data-wall-item]')];
  if (!dialog || typeof dialog.showModal !== 'function' || items.length === 0) return;

  const imgEl = dialog.querySelector<HTMLImageElement>('[data-wall-lb-img]');
  const videoEl = dialog.querySelector<HTMLVideoElement>('[data-wall-lb-video]');
  const playEl = dialog.querySelector<HTMLElement>('[data-wall-lb-play]');
  const capEl = dialog.querySelector<HTMLElement>('[data-wall-lb-caption]');
  const linkEl = dialog.querySelector<HTMLAnchorElement>('[data-wall-lb-link]');
  const linkText = dialog.querySelector<HTMLElement>('[data-wall-lb-linktext]');
  if (!imgEl || !capEl || !linkEl || !linkText) return;

  let idx = 0;

  /** Show the still image (poster) — used for photos and the video fallback. */
  const showPoster = (poster: string, caption: string, asVideo: boolean) => {
    imgEl.src = poster;
    // Empty alt when the caption is shown below (the figcaption is the text
    // alternative) — avoids duplicating it; a generic alt only when captionless.
    imgEl.alt = caption ? '' : 'A moment from West Chester Preschool';
    imgEl.hidden = false;
    if (videoEl) videoEl.hidden = true;
    if (playEl) playEl.hidden = !asVideo; // the play glyph hints "it's a video"
  };

  const show = (i: number) => {
    if (videoEl) videoEl.pause();
    idx = (i + items.length) % items.length;
    const el = items[idx];
    const caption = el.dataset.caption || '';
    const isVideo = el.dataset.video === 'true';
    const videoUrl = el.dataset.videoUrl || '';
    const poster = el.dataset.full || '';

    if (isVideo && videoUrl && videoEl) {
      // Play inline; keep the poster ready for the error fallback.
      videoEl.poster = poster;
      videoEl.src = videoUrl;
      videoEl.hidden = false;
      imgEl.hidden = true;
      if (playEl) playEl.hidden = true;
      videoEl.load();
    } else {
      showPoster(poster, caption, isVideo);
    }

    capEl.textContent = caption;
    capEl.hidden = caption.length === 0;
    linkEl.href = el.dataset.href || linkEl.href;
    linkText.textContent = isVideo ? 'Watch on Instagram' : 'View on Instagram';
  };

  // Expired/blocked video URL → drop back to the poster still + play badge.
  videoEl?.addEventListener('error', () => {
    const el = items[idx];
    showPoster(el?.dataset.full || '', el?.dataset.caption || '', true);
  });

  items.forEach((el, i) => {
    el.addEventListener('click', (e) => {
      // Let modified clicks (new tab, etc.) follow the real link.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      show(i);
      dialog.showModal();
    });
  });

  const close = () => {
    if (videoEl) videoEl.pause();
    dialog.close();
  };
  dialog.querySelector('[data-wall-close]')?.addEventListener('click', close);
  dialog.querySelector('[data-wall-prev]')?.addEventListener('click', () => show(idx - 1));
  dialog.querySelector('[data-wall-next]')?.addEventListener('click', () => show(idx + 1));
  // Native Esc/backdrop close fires the dialog's `close` event — pause there too.
  dialog.addEventListener('close', () => videoEl?.pause());

  // Click the backdrop (the dialog area outside its content) to close.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
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
