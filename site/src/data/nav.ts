// =============================================================================
// Navigation — the BUILD-TIME FALLBACK for the Sanity "Menus" doc
// =============================================================================
// The live header/footer nav is Board-edited in Sanity (the Menus doc) and
// resolved by src/lib/nav.ts; this file is only used when that doc is missing
// or empty, so the site never loses its navigation. Keep it MIRRORING the live
// Sanity nav (last synced against the deployed site 2026-07-17) — a stale
// fallback silently drops pages the day the Menus doc fails to load.
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
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Safety', href: '/safety' },
  {
    label: 'Classes',
    children: [
      { label: 'Twos Class', href: '/classes/twos' },
      { label: 'Threes Class', href: '/classes/threes' },
      { label: 'Pre-K Class', href: '/classes/pre-k' },
      { label: 'Co-op Life', href: '/co-op-life' },
    ],
  },
  { label: 'Enroll', href: '/enroll' },
  { label: 'Virtual Tour', href: '/virtual-tour' },
  {
    label: 'Families',
    children: [
      { label: 'Why WCP?', href: '/why-wcp' },
      { label: 'Enrolled Families', href: '/family-hub' },
      { label: 'Store', href: 'https://store.westchesterpreschool.org', external: true },
    ],
  },
  { label: 'Contact', href: '/contact' },
  { label: 'News', href: '/news' },
];

// Footer link columns (a curated subset + a couple info links).
export const footerNav: NavGroup[] = [
  {
    label: 'Classes',
    children: [
      { label: 'Twos Class', href: '/classes/twos' },
      { label: 'Threes Class', href: '/classes/threes' },
      { label: 'Pre-K Class', href: '/classes/pre-k' },
      { label: 'Co-op Life', href: '/co-op-life' },
    ],
  },
  {
    label: 'Families',
    children: [
      { label: 'Why WCP?', href: '/why-wcp' },
      { label: 'A Day at WCP', href: '/a-day-at-wcp' },
      { label: 'Tuition & Fees', href: '/tuition' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Enrolled Families', href: '/family-hub' },
      { label: 'Safety & Wellness', href: '/safety' },
      { label: 'What Families Say', href: '/reviews' },
    ],
  },
  {
    label: 'Get Started',
    children: [
      { label: 'Enroll', href: '/enroll' },
      // Deep link to the tour-request form: `sec-` + the section's stable
      // Sanity _key (see titleIdFor in section-helpers.ts) — the tour ask
      // lands ON the form, not on /enroll.
      { label: 'Schedule a Tour', href: '/virtual-tour#sec-pp-tour-form' },
      { label: 'Virtual Tour', href: '/virtual-tour' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    label: 'Get Involved',
    children: [
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
];
