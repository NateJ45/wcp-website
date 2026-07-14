// =============================================================================
// Family Hub navigation — the gated sections (mirrors the old Squarespace hub)
// =============================================================================
// Grouped links shown on the hub rail (desktop) and drawer (mobile). Icons are
// Lucide names (the old site used emoji; we use the site's line-icon set for
// consistency).
//
// ACCENTS: each group owns a brand accent that colors its label and its links'
// icons on the navy rail. The rail is a THEME-STABLE NAVY ISLAND (identical in
// light/dark), so accents are hardcoded hexes, not tokens — and because group
// labels are small bold text on navy (#01457e), every label hex below is
// AA-checked at >= 4.5:1 (bright brand tints, not the darker page-side inks):
//   sky #7dd3fc 5.4:1 · amber #ffa334 4.6:1 · green #4ade80 5.2:1 ·
//   orange #fdba74 5.4:1
// Link icons may use any of these freely (decorative; the link's white text
// carries the contrast).
// =============================================================================

export interface HubLink {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
  /** Icon accent override (e.g. per-class colors). Defaults to the group accent. */
  iconColor?: string;
}
export interface HubGroup {
  label: string;
  /** AA-safe (>=4.5:1 on navy) hex for the group label + default icon color. */
  accent?: string;
  links: HubLink[];
}

// The four class colors, bright-tint tier (AA-safe as label text on navy, and
// matching each class's brand color from src/lib/class-colors.ts).
const CLASS_ACCENT: Record<string, string> = {
  twos: '#ffa334', // amber
  threes: '#4ade80', // green
  'pre-k-am': '#fdba74', // orange
  'pre-k-pm': '#7dd3fc', // sky
};

export const hubNav: HubGroup[] = [
  {
    label: 'Hub',
    links: [{ label: 'Home', href: '/family-hub', icon: 'house' }],
  },
  {
    label: 'News & Events',
    accent: '#7dd3fc', // sky
    links: [
      { label: 'Updates', href: '/family-hub/updates', icon: 'newspaper' },
      { label: 'Calendar', href: '/family-hub/calendar', icon: 'calendar-days' },
    ],
  },
  {
    label: 'Resources',
    accent: '#ffa334', // amber
    links: [
      { label: 'Getting Started', href: '/family-hub/getting-started', icon: 'rocket' },
      { label: 'Documents', href: '/family-hub/documents', icon: 'folder-open' },
      { label: 'Health', href: '/family-hub/health', icon: 'heart-pulse' },
    ],
  },
  {
    label: 'Budget',
    accent: '#4ade80', // green — it's the money group
    links: [
      { label: 'Tuition', href: '/family-hub/tuition', icon: 'circle-dollar-sign' },
      { label: 'Fundraising', href: '/family-hub/fundraising', icon: 'party-popper' },
    ],
  },
  {
    label: 'Community',
    accent: '#fdba74', // orange
    links: [
      { label: 'Sign-ups', href: '/family-hub/sign-ups', icon: 'clipboard-list' },
      { label: 'My Hours', href: '/family-hub/hours', icon: 'clock' },
      { label: 'Celebrations', href: '/family-hub/celebrations', icon: 'party-popper' },
      { label: 'Photos', href: '/family-hub/photos', icon: 'camera' },
      { label: 'Directory', href: '/family-hub/directory', icon: 'contact' },
      { label: 'Co-op Jobs', href: '/family-hub/coop-jobs', icon: 'heart-handshake' },
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
    accent: '#7dd3fc', // sky label; each class link carries its own class color
    links: [
      { label: 'Twos', href: '/family-hub/twos', icon: 'blocks', iconColor: CLASS_ACCENT.twos },
      {
        label: 'Threes',
        href: '/family-hub/threes',
        icon: 'crayon',
        iconColor: CLASS_ACCENT.threes,
      },
      // One page for both Pre-K classes — same teacher, same handbook; the AM/PM
      // facts live side by side on the page itself.
      {
        label: 'Pre-K',
        href: '/family-hub/pre-k',
        icon: 'sun',
        iconColor: CLASS_ACCENT['pre-k-am'],
      },
    ],
  },
];
