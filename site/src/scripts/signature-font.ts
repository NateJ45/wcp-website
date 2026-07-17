// =============================================================================
// signature-font.ts — load the Great Vibes signature face, non-render-blocking
// =============================================================================
// Public pages that show a handwritten signature (testimonial "parent notes",
// the living-photograph hero caption) need the Great Vibes face, but a static
// or dynamic CSS import of @fontsource/great-vibes gets hoisted into a
// render-blocking stylesheet on EVERY page (the same Lighthouse trap the note
// modal avoids). So we register the face through the FontFace API from just the
// hashed woff2 URL, once, when a `.wcp-signature` element is actually on the
// page. Browsers without FontFace (none we support) keep the cursive fallback
// in --font-signature, and the text stays fully readable either way.
import { onPageLoad } from '@/scripts/_page-load';
import greatVibesWoff2 from '@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff2?url';

let requested = false;
function ensureSignatureFont() {
  if (requested || typeof FontFace === 'undefined') return;
  if (!document.querySelector('.wcp-signature')) return;
  requested = true;
  const face = new FontFace('Great Vibes', `url(${greatVibesWoff2}) format('woff2')`, {
    style: 'normal',
    weight: '400',
    display: 'swap',
  });
  face
    .load()
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => {
      /* the cursive fallback stays — signatures remain legible */
    });
}

onPageLoad(ensureSignatureFont);
