// ============================================================================
// Hero background video — deferred, graceful load-in
// ============================================================================
// The hero's still poster (a tiny WebP) is the LCP and paints immediately. The
// background <video> is deliberately heavier, so we:
//
//   1. DEFER its download until the load event has fired AND the browser is
//      idle — so the multi-MB file never competes with the LCP poster or first
//      interaction. (The <video> ships preload="none"; nothing loads until we
//      call play() here.)
//   2. FADE it in only once it is actually playing frames, cross-fading over
//      the poster — a smooth "load-in", never an abrupt pop.
//
// It stays a still poster (never plays) for anyone who asked for reduced motion
// or is on a data-saver / very slow connection — so the hero never depends on
// the video to look right, and we respect people's bandwidth and preferences.
// The <video> has no `autoplay` attribute for exactly this reason.
//
// Runs once per document via onPageLoad. Speculation-Rules guard: in a
// PRERENDERED (hidden) document we wait for activation before touching the
// video — otherwise hovering a link could quietly download ~9MB for a page
// the visitor never opens.
// ============================================================================
import { onPageLoad } from './_page-load';

interface SaveDataConnection {
  saveData?: boolean;
  effectiveType?: string;
}

function start(v: HTMLVideoElement): void {
  v.muted = true; // required for programmatic autoplay
  // Reveal only when real frames start painting, so we never fade in a blank
  // or half-buffered video over the crisp poster.
  v.addEventListener('playing', () => (v.style.opacity = '1'), { once: true });
  // play() can reject (autoplay blocked, low power, data-saver) — that's fine,
  // the poster simply stays visible and nothing breaks.
  v.play().catch(() => {});
}

function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Respect data-saver and very slow connections — keep the lightweight poster.
  const conn = (navigator as Navigator & { connection?: SaveDataConnection }).connection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType ?? ''))) return;

  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-hero-video]'));
  if (videos.length === 0) return;

  const kick = (): void => videos.forEach(start);

  // Defer to idle AFTER the load event. Idle alone is not enough: on a throttled
  // phone the main thread goes idle at ~500ms while the hero poster, fonts and
  // CSS are still in flight, and the 3MB webm then shares the connection with
  // the LCP (measured 2026-09-04: the video started at 542ms in Lighthouse).
  // After `load` every first-paint resource is done, so the video costs nothing
  // the visitor can see.
  const whenIdle = (): void => {
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
      }
    ).requestIdleCallback;
    if (typeof ric === 'function') ric(kick, { timeout: 4000 });
    else window.setTimeout(kick, 500);
  };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}

onPageLoad(() => {
  const doc = document as Document & { prerendering?: boolean };
  if (doc.prerendering) {
    document.addEventListener('prerenderingchange', init, { once: true });
  } else {
    init();
  }
});

export {};
