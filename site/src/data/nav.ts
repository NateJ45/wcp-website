// =============================================================================
// Navigation — the CODE-OWNED nav doctrine (IA redesign, 2026-07-17)
// =============================================================================
// The header nav is the FUNNEL, not a filing cabinet. Nathan's read ("a lot of
// pages and the nav is overwhelming") matched the audit: ~9 top-level items +
// 2 competing CTAs, while Tuition (the moat) hid in the footer. The doctrine:
// five items in the parent's decision order, one CTA.
//
//   Classes -> Why WCP -> Tuition -> Visit -> Enroll   [Schedule a Tour]
//   (fit)      (belief)   (cost)     (act)    (commit)
//
// Home is the logo. About/Contact/News left the header (About merges into
// Why WCP and Contact into a "Visit Us" page when the Sanity quota returns —
// queued in docs/PENDING.md; until then all three stay reachable from the
// footer, which remains the full sitemap). The Family Hub link lives in the
// header utility row + footer, not the funnel nav.
//
// OWNERSHIP: resolveNavigation (src/lib/nav.ts) currently serves THIS file and
// bypasses the Sanity Menus doc — the funnel architecture is a design decision
// (like the computed seams), and the Menus doc can't be patched while writes
// are quota-frozen. The reconcile path is registered in docs/PENDING.md.
// Groups with `children` render as a dropdown in the header and a labeled
// section in the mobile menu. `external: true` links open in a new tab.
// =============================================================================

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}
export interface NavGroup {
  label: string;
  children: NavLink[];
}
export type NavItem = NavLink | NavGroup;

export function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

export const mainNav: NavItem[] = [
  {
    label: 'Classes',
    children: [
      { label: 'Twos Class', href: '/classes/twos' },
      { label: 'Threes Class', href: '/classes/threes' },
      { label: 'Pre-K Class', href: '/classes/pre-k' },
      { label: 'A Day at WCP', href: '/a-day-at-wcp' },
    ],
  },
  {
    label: 'Why WCP',
    children: [
      { label: 'Why Families Choose Us', href: '/why-wcp' },
      { label: 'Co-op Life', href: '/co-op-life' },
      { label: 'Safety & Wellness', href: '/safety' },
      { label: 'What Families Say', href: '/reviews' },
    ],
  },
  { label: 'Tuition', href: '/tuition' },
  // "Visit" becomes the merged Visit Us page (virtual tour + tour form +
  // contact details) when the quota-queued content patch lands; the slug
  // stays /virtual-tour so no redirect churn is needed before then.
  { label: 'Visit', href: '/virtual-tour' },
  { label: 'Enroll', href: '/enroll' },
];

// Footer link columns — the FULL sitemap lives here on purpose: everything
// demoted from the header (About, Contact, News, FAQ, hub, giving) must stay
// one footer click away so nothing orphans before the page merges land.
export const footerNav: NavGroup[] = [
  {
    label: 'Classes',
    children: [
      { label: 'Twos Class', href: '/classes/twos' },
      { label: 'Threes Class', href: '/classes/threes' },
      { label: 'Pre-K Class', href: '/classes/pre-k' },
      { label: 'A Day at WCP', href: '/a-day-at-wcp' },
      { label: 'Co-op Life', href: '/co-op-life' },
    ],
  },
  {
    label: 'About',
    children: [
      { label: 'Our Story', href: '/about' },
      { label: 'Why WCP?', href: '/why-wcp' },
      { label: 'Safety & Wellness', href: '/safety' },
      { label: 'What Families Say', href: '/reviews' },
      { label: 'FAQ', href: '/faq' },
      { label: 'News', href: '/news' },
      { label: 'Events', href: '/events' },
    ],
  },
  {
    label: 'Get Started',
    children: [
      { label: 'Tuition & Fees', href: '/tuition' },
      // Deep link to the tour-request form: `sec-` + the section's stable
      // Sanity _key (see titleIdFor in section-helpers.ts) — the tour ask
      // lands ON the form, not on /enroll.
      { label: 'Schedule a Tour', href: '/virtual-tour#sec-pp-tour-form' },
      { label: 'Visit Us', href: '/virtual-tour' },
      { label: 'Enroll', href: '/enroll' },
      { label: 'Contact', href: '/virtual-tour' },
    ],
  },
  {
    label: 'Community',
    children: [
      { label: 'Enrolled Families', href: '/family-hub' },
      { label: 'Work With Us', href: '/work-with-us' },
      { label: 'Donate', href: '/donate' },
      { label: 'Newsletter', href: '/newsletter' },
      { label: 'Store', href: 'https://store.westchesterpreschool.org', external: true },
    ],
  },
];

// Legal / policy links — rendered in the footer's bottom bar.
export const legalNav: NavLink[] = [
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Colophon', href: '/colophon' },
];
