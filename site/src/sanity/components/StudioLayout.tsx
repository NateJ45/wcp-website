import type { LayoutProps } from 'sanity';
// Quicksand's @font-face (hashed woff2 URLs) — same Fontsource package the
// public site uses, so Vite bundles the exact same files for the Studio.
import '@fontsource-variable/quicksand/index.css';
import emblem from '../../assets/brand/wcp-emblem.png';

// =============================================================================
// StudioLayout — loads the brand fonts into the Studio
// =============================================================================
// The theme (theme.ts) tells Sanity to USE Quicksand via --font-family-base;
// this layout wrapper makes sure the font files are actually LOADED, and
// registers Captain Comic (the display face) for the `.wcp-display` hook used
// by the Welcome pane. Captain Comic is served from /fonts on the site origin,
// so under `npx sanity dev` (a different origin) it quietly falls back to
// Quicksand — fine for a dev-only session.
// =============================================================================

const fontCss = `
@font-face {
  font-family: 'Captain Comic';
  src: url('/fonts/captain-comic-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Captain Comic';
  src: url('/fonts/captain-comic-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
.wcp-display {
  font-family: 'Captain Comic', 'Quicksand Variable', system-ui, sans-serif !important;
}
`;

export function StudioLayout(props: LayoutProps) {
  return (
    <>
      <style>{fontCss}</style>
      {props.renderDefault(props)}
    </>
  );
}

// The workspace icon (navbar + workspace switcher): the sun+cloud emblem.
// Vite returns ImageMetadata under Astro and a plain URL string under
// `npx sanity dev`; handle both.
const emblemSrc: string = typeof emblem === 'string' ? emblem : emblem.src;

export function WcpWorkspaceIcon() {
  return (
    <img src={emblemSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  );
}
