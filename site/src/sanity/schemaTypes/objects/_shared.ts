import { defineField } from 'sanity';

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
    description: opts.description ?? 'Pick an icon (optional).',
    options: {
      list: ICON_NAMES.map((v) => ({ title: v, value: v })),
    },
  });
}

// The four background bands a section can sit on — the ONLY styling lever an
// editor gets, matching Section.astro's `bg` prop. No custom colours.
export const BACKGROUND_OPTIONS = [
  { title: 'White', value: 'white' },
  { title: 'Light grey', value: 'grey' },
  { title: 'Warm cream', value: 'cream' },
  { title: 'Navy (dark band)', value: 'navy' },
];

/** The band-appearance fields every content section shares (→ Section.astro). */
export function bandFields(defaultBackground: 'white' | 'grey' | 'cream' | 'navy' = 'white') {
  return [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      options: { list: BACKGROUND_OPTIONS, layout: 'radio' },
      initialValue: defaultBackground,
    }),
    defineField({
      name: 'seam',
      title: 'Cloud seam at top',
      type: 'boolean',
      description:
        'Adds the soft cloud divider at the top of this band. Use only where the background colour changes from the section above.',
      initialValue: false,
    }),
    defineField({
      name: 'compact',
      title: 'Tighter spacing',
      type: 'boolean',
      description: 'Reduces the vertical padding of this band.',
      initialValue: false,
    }),
  ];
}
