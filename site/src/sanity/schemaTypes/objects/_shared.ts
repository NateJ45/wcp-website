import { defineField } from 'sanity';
import { IconPickerInput } from '../../components/IconPickerInput';

// =============================================================================
// Shared schema building blocks for the page builder
// =============================================================================
// Helpers reused across every section type, so the "brand-locked" rules
// (fixed background bands, a known icon set, no free-form styling) live in ONE
// place. Editors choose WHAT and IN WHAT ORDER; they never get colour / font /
// spacing controls.
// =============================================================================

// The icon names our <Icon> component can actually render (src/lib/
// lucide-icons.ts + brand-icons.ts). Kept as a literal list so the Studio
// shows a safe dropdown instead of a free-text box a volunteer could typo into
// a build-breaking value. KEEP IN SYNC if icons are added/removed there.
export const ICON_NAMES = [
  'arrow-right',
  'award',
  'baby',
  'banknote',
  'bell',
  'blocks',
  'book-open',
  'building-2',
  'cake',
  'calculator',
  'calendar-days',
  'camera',
  'check',
  'circle-dollar-sign',
  'clipboard-list',
  'clock',
  'coins',
  'contact',
  'door-open',
  'dumbbell',
  'egg',
  'eye',
  'file-check',
  'file-pen',
  'file-text',
  'flower',
  'folder',
  'folder-open',
  'gift',
  'graduation-cap',
  'hand',
  'hand-heart',
  'heart',
  'heart-handshake',
  'heart-pulse',
  'house',
  'image',
  'info',
  'languages',
  'leaf',
  'list',
  'lock',
  'mail',
  'map-pin',
  'megaphone',
  'message-circle',
  'microscope',
  'moon',
  'newspaper',
  'notebook-pen',
  'palette',
  'party-popper',
  'pencil',
  'phone',
  'piggy-bank',
  'puzzle',
  'scale',
  'school',
  'send',
  'shield-check',
  'shopping-bag',
  'snowflake',
  'sparkles',
  'sprout',
  'star',
  'sun',
  'tent',
  'trees',
  'trending-down',
  'users',
] as const;

// Human-friendly labels for the dropdown, so a volunteer sees "Dollar sign"
// not "circle-dollar-sign". Any icon missing here falls back to a titleized
// version of its slug (so adding an icon to ICON_NAMES can't break the list).
const ICON_LABELS: Partial<Record<(typeof ICON_NAMES)[number], string>> = {
  'arrow-right': 'Arrow',
  award: 'Award ribbon',
  baby: 'Baby',
  banknote: 'Cash / banknote',
  bell: 'Bell',
  blocks: 'Building blocks',
  'book-open': 'Open book',
  'building-2': 'Building',
  cake: 'Cake',
  calculator: 'Calculator',
  'calendar-days': 'Calendar',
  camera: 'Camera',
  check: 'Checkmark',
  'circle-dollar-sign': 'Dollar sign',
  'clipboard-list': 'Clipboard',
  clock: 'Clock',
  coins: 'Coins',
  contact: 'Contact card',
  'door-open': 'Open door',
  dumbbell: 'Dumbbell',
  egg: 'Egg',
  eye: 'Eye',
  'file-check': 'Checked file',
  'file-pen': 'File with pen',
  'file-text': 'Document',
  flower: 'Flower',
  folder: 'Folder',
  'folder-open': 'Open folder',
  gift: 'Gift',
  'graduation-cap': 'Graduation cap',
  hand: 'Hand',
  'hand-heart': 'Caring hand',
  heart: 'Heart',
  'heart-handshake': 'Handshake with heart',
  'heart-pulse': 'Heartbeat / health',
  house: 'House',
  image: 'Picture',
  info: 'Info',
  languages: 'Languages',
  leaf: 'Leaf',
  list: 'List',
  lock: 'Lock',
  mail: 'Envelope',
  'map-pin': 'Map pin',
  megaphone: 'Megaphone',
  'message-circle': 'Speech bubble',
  microscope: 'Microscope',
  moon: 'Moon',
  newspaper: 'Newspaper',
  'notebook-pen': 'Notebook',
  palette: 'Paint palette',
  'party-popper': 'Party popper',
  pencil: 'Pencil',
  phone: 'Phone',
  'piggy-bank': 'Piggy bank',
  puzzle: 'Puzzle piece',
  scale: 'Balance scale',
  school: 'School',
  send: 'Paper plane',
  'shield-check': 'Shield / safety',
  'shopping-bag': 'Shopping bag',
  snowflake: 'Snowflake',
  sparkles: 'Sparkles',
  sprout: 'Sprout',
  star: 'Star',
  sun: 'Sun',
  tent: 'Tent',
  trees: 'Trees',
  'trending-down': 'Trending down',
  users: 'People',
};

const iconLabel = (v: (typeof ICON_NAMES)[number]): string =>
  ICON_LABELS[v] ?? v.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

// The dropdown list, alphabetized by friendly label so it's easy to scan.
const ICON_OPTIONS = ICON_NAMES.map((v) => ({ title: iconLabel(v), value: v })).sort((a, b) =>
  a.title.localeCompare(b.title),
);

/** A validated icon-name dropdown field. */
export function iconField(
  name = 'icon',
  opts: { title?: string; description?: string; group?: string } = {},
) {
  return defineField({
    name,
    title: opts.title ?? 'Icon',
    type: 'string',
    group: opts.group,
    description: opts.description ?? 'Pick a little picture (optional).',
    options: {
      list: ICON_OPTIONS,
    },
    // Show the icons themselves, not just their names (2026-08-30).
    components: { input: IconPickerInput },
  });
}

// The background bands a section can sit on — the ONLY styling lever an
// editor gets, matching Section.astro's `bg` prop. No custom colours.
// Sunshine + Sky joined 2026-09-01 (the bold pass): saturated brand tints,
// AA-checked with the default ink text, so a volunteer still cannot ship a
// contrast failure whichever radio they pick.
export const BACKGROUND_OPTIONS = [
  { title: 'White', value: 'white' },
  { title: 'Light grey', value: 'grey' },
  { title: 'Warm cream', value: 'cream' },
  { title: 'Sunshine (bold warm)', value: 'sunshine' },
  { title: 'Sky (soft blue)', value: 'sky' },
  { title: 'Navy (dark band)', value: 'navy' },
];

/** The band-appearance fields every content section shares (→ Section.astro). */
export function bandFields(
  defaultBackground: 'white' | 'grey' | 'cream' | 'sunshine' | 'sky' | 'navy' = 'white',
) {
  return [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      options: { list: BACKGROUND_OPTIONS, layout: 'radio' },
      initialValue: defaultBackground,
    }),
    // NOTE: the "cloud seam at top" toggle was removed 2026-07-17. The divider
    // is now placed automatically by the site (SectionRenderer computes it from
    // the colours of adjacent bands), so it always lands in the right spot and
    // is never a knob a board member has to reason about. Nothing to do here.
    // Hidden 2026-08-23 (field audit): 1 of 173 live sections had ever set
    // it, and an invisible padding tweak doubled the appearance form on ~37
    // section types. Still rendered, so that one use is unchanged.
    defineField({
      name: 'compact',
      title: 'Tighter spacing',
      type: 'boolean',
      hidden: true,
      initialValue: false,
    }),
  ];
}
