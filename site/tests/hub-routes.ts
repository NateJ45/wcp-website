// =============================================================================
// Every GATED hub route worth sweeping — the SSR counterpart to routes.ts
// =============================================================================
// routes.ts lists the PRERENDERED pages and says, in its own header, that the
// Family Hub is excluded because it is on-demand SSR behind a password: "SSR
// a11y/reflow coverage lands when the hub pages get their real content."
//
// That day arrived. The hub is now the most complex part of the site — the
// directory, the org chart, the board admin — and it was the only half with no
// axe sweep at all. On 2026-09-06 the admin shipped with body text at 1.14:1
// against its card (a `text-muted` background token used as a text colour); a
// human spotted it by selecting the invisible text. axe's color-contrast rule
// would have failed the build instead.
//
// Add a route here when a new hub page ships.

/** Gated hub pages a signed-in family sees. */
export const hubRoutes = [
  '/family-hub',
  '/family-hub/calendar',
  '/family-hub/celebrations',
  '/family-hub/coop-jobs',
  '/family-hub/directory',
  '/family-hub/documents',
  '/family-hub/fundraising',
  '/family-hub/getting-started',
  '/family-hub/hours',
  '/family-hub/photos',
  '/family-hub/sign-ups',
  '/family-hub/super-helper',
  '/family-hub/tuition',
  '/family-hub/updates',
];

/**
 * Board-only screens. Behind a SECOND password, so they need the admin session
 * (tests/hub-admin.setup.ts) rather than the family one.
 *
 * `/family-hub/admin/login` is deliberately absent: it is reachable with only
 * the family session and is swept as part of hubRoutes' gate coverage.
 */
export const adminRoutes = ['/family-hub/admin'];
