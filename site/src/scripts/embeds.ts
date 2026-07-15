// Click-to-load embeds. The Video and Map sections render only a facade + a
// button; the third-party iframe (YouTube/Vimeo/Google Maps) is inserted here
// only after the visitor clicks, so nothing loads Google/YouTube on a normal
// page view. Keeps every page private and fast until the visitor opts in.
//
// An element may opt into AUTO-loading with `data-embed-auto`: the iframe is
// inserted on idle after first paint (requestIdleCallback), so it appears
// without a click but never blocks initial render (used by the hub calendar,
// which families expect to just be there). The facade + button stays as the
// no-JS / pre-idle fallback.
// Re-binds on each View Transition navigation via onPageLoad.
import { onPageLoad } from './_page-load';

function makeIframe(src: string, title: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title;
  iframe.loading = 'lazy';
  iframe.className = 'absolute inset-0 h-full w-full';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  );
  iframe.setAttribute('allowfullscreen', 'true');
  return iframe;
}

function loadEmbed(el: HTMLElement): HTMLIFrameElement | null {
  if (el.dataset.embedLoaded) return null;
  const src = el.dataset.embedVideo || el.dataset.embedMap || el.dataset.embedCalendar;
  if (!src) return null;
  el.dataset.embedLoaded = '1';
  const title = el.dataset.embedTitle || 'Embedded content';
  const iframe = makeIframe(src, title);
  el.replaceChildren(iframe);
  return iframe;
}

onPageLoad(() => {
  document
    .querySelectorAll<HTMLElement>('[data-embed-video], [data-embed-map], [data-embed-calendar]')
    .forEach((el) => {
      const button = el.querySelector<HTMLButtonElement>('.wcp-embed-play, .wcp-embed-open');
      // Explicit click: load and move focus into the iframe.
      button?.addEventListener('click', () => loadEmbed(el)?.focus(), { once: true });

      // Opted-in embeds load themselves once the browser is idle — after first
      // paint, so the page never waits on the third party. No focus steal.
      if (el.hasAttribute('data-embed-auto')) {
        const go = () => loadEmbed(el);
        if ('requestIdleCallback' in window)
          (window as Window).requestIdleCallback(go, { timeout: 2500 });
        else setTimeout(go, 800);
      }
    });
});
