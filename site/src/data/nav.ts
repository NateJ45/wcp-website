// =============================================================================
// Navigation — single source of truth for the header + footer + mobile menu
// =============================================================================
// Safe to edit these labels/links. Groups with `children` render as a dropdown
// in the header and a labeled section in the mobile menu. `external: true`
// links open in a new tab. (In the new stack this could move into Sanity
// siteSettings later; for now it lives here.)
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
    ],
  },
  {
    label: 'Get Started',
    children: [
      { label: 'Enroll', href: '/enroll' },
      { label: 'Schedule a Tour', href: '/enroll' },
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
