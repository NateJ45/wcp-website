// Every public, PRERENDERED route on the site — the single source of truth for
// the sweeps. The suites serve the static `dist/client`, so only build-time HTML
// pages belong here. The Family Hub (`/family-hub/**`) is on-demand SSR behind a
// password gate (prerender=false), so it is NOT in dist/client and is excluded
// here. The gate flow is verified separately (see the dev-server curl checks);
// SSR a11y/reflow coverage lands when the hub pages get their real content.
// Add a route here when a new PRERENDERED page ships.
export const routes = [
  '/',
  '/about',
  '/classes/twos',
  '/classes/threes',
  '/classes/pre-k',
  '/co-op-life',
  '/why-wcp',
  '/a-day-at-wcp',
  '/tuition',
  '/faq',
  '/enroll',
  '/contact',
  '/virtual-tour',
  '/work-with-us',
  '/donate',
  '/newsletter',
  '/newsletter/archive',
  '/accessibility',
  '/privacy',
  '/terms',
  '/news',
  '/news/welcome-to-our-new-website',
  '/events',
  '/thank-you',
  '/search',
];
