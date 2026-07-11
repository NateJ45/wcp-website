// =============================================================================
// Family Hub navigation — the gated sections (mirrors the old Squarespace hub)
// =============================================================================
// Four groups of pills shown on every hub page. Icons are Lucide names (the
// old site used emoji; we use the site's line-icon set for consistency).
// =============================================================================

export interface HubLink {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
}
export interface HubGroup {
  label: string;
  links: HubLink[];
}

export const hubNav: HubGroup[] = [
  {
    label: 'Hub',
    links: [{ label: 'Home', href: '/family-hub', icon: 'house' }],
  },
  {
    label: 'Information',
    links: [
      { label: 'Calendar', href: '/family-hub/calendar', icon: 'calendar-days' },
      { label: 'Co-op Jobs', href: '/family-hub/coop-jobs', icon: 'heart-handshake' },
      { label: 'Documents', href: '/family-hub/documents', icon: 'folder-open' },
      { label: 'Tuition', href: '/family-hub/tuition', icon: 'circle-dollar-sign' },
      { label: 'Updates', href: '/family-hub/updates', icon: 'newspaper' },
    ],
  },
  {
    label: 'Community',
    links: [
      { label: 'Fundraising', href: '/family-hub/fundraising', icon: 'party-popper' },
      { label: 'Health', href: '/family-hub/health', icon: 'heart-pulse' },
      { label: 'Directory', href: '/family-hub/directory', icon: 'contact' },
      {
        label: 'Store',
        href: 'https://store.westchesterpreschool.org/',
        icon: 'shopping-bag',
        external: true,
      },
    ],
  },
  {
    label: 'Classes',
    links: [
      { label: 'Twos', href: '/family-hub/twos', icon: 'star' },
      { label: 'Threes', href: '/family-hub/threes', icon: 'sprout' },
      { label: 'Pre-K AM', href: '/family-hub/pre-k-am', icon: 'sun' },
      { label: 'Pre-K PM', href: '/family-hub/pre-k-pm', icon: 'moon' },
    ],
  },
];
