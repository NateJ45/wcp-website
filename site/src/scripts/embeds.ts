// Click-to-load embeds. The Video and Map sections render only a facade + a
// button; the third-party iframe (YouTube/Vimeo/Google Maps) is inserted here
// only after the visitor clicks, so nothing loads Google/YouTube on a normal
// page view. Keeps every page private and fast until the visitor opts in.
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

document.querySelectorAll<HTMLElement>('[data-embed-video], [data-embed-map]').forEach((el) => {
  const button = el.querySelector<HTMLButtonElement>('.wcp-embed-play, .wcp-embed-open');
  if (!button) return;
  button.addEventListener(
    'click',
    () => {
      const src = el.dataset.embedVideo || el.dataset.embedMap;
      if (!src) return;
      const title = el.dataset.embedTitle || 'Embedded content';
      const iframe = makeIframe(src, title);
      el.replaceChildren(iframe);
      iframe.focus();
    },
    { once: true },
  );
});
