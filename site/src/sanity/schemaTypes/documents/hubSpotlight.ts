import { defineType, defineField } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { iconField } from '../objects/_shared';
import { BUILTIN_HUB_LINKS } from '../../../lib/hub-nav-doc';

// =============================================================================
// hubSpotlight — a "look at this" pop-up for families, on any hub page
// =============================================================================
// The collection sibling of the President's note. That is ONE letter on the hub
// home; this is a LIST, because a school year has several things worth a
// pop-up: the supply lists in August, the auction in March, a store offer in
// December. Each one greets a signed-in family once, on whatever hub page they
// land on, and stays closed after that until the Board bumps its version stamp.
//
// Why a new type and not the public `announcement`: an announcement is baked
// into the STATIC public site at build time, its pages field points at public
// `page` documents, and its placement model is public paths. A hub pop-up is
// read at REQUEST time behind the password gate and links to hub pages,
// updates, and the store. Sharing one type would have coupled hub SSR to the
// build-time query path — see docs/FAMILY_HUB.md "Spotlight pop-ups".
//
// Several live at once? Families get ONE pop-up holding all of them, with
// arrows to page through in the order the Board dragged them. It opens at the
// first one that family has not read yet.
//
// VALIDATION RULE (learned on hubNavMenu, 2026-08-29): a field that is hidden
// must never block publishing. Every link field below validates only when the
// Board asked for a button AND chose that kind.
// =============================================================================

export const SPOTLIGHT_TONES = [
  { title: 'Info (navy)', value: 'info' },
  { title: 'Good news (green)', value: 'good' },
  { title: 'Heads-up (amber)', value: 'warning' },
  { title: 'Warm (orange)', value: 'brand' },
];

/** True when the Board left the button label blank, so no link field applies. */
function noButton(parent: unknown): boolean {
  return !(parent as { linkLabel?: string } | undefined)?.linkLabel?.trim();
}

/** True when a button exists and points at this kind. */
function isKind(parent: unknown, kind: string): boolean {
  const p = parent as { linkLabel?: string; linkKind?: string } | undefined;
  return Boolean(p?.linkLabel?.trim()) && p?.linkKind === kind;
}

export const hubSpotlight = defineType({
  name: 'hubSpotlight',
  title: 'Spotlight pop-up',
  type: 'document',
  icon: () => '🔦',
  groups: [
    { name: 'content', title: 'What it says', default: true },
    { name: 'button', title: 'The button' },
    { name: 'timing', title: 'When it shows' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Name (just for you)',
      type: 'string',
      group: 'content',
      description: 'A label so you can find it in the list, e.g. "August supply lists".',
      validation: (R) => R.required().error('Give it a name so you can find it in the list.'),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
      description: 'The big line families read first, e.g. "Supply lists are ready".',
      validation: (R) => R.required().error('The pop-up needs a heading.'),
    }),
    defineField({
      name: 'dateLabel',
      title: 'Date line (optional)',
      type: 'string',
      group: 'content',
      description: 'A small line under the heading, e.g. "August 2026".',
    }),
    defineField({
      name: 'summary',
      title: 'Short line (optional)',
      type: 'text',
      rows: 2,
      group: 'content',
      description: 'One or two sentences, shown above the message in slightly larger text.',
    }),
    defineField({
      name: 'body',
      title: 'Message',
      type: 'postBody',
      group: 'content',
      description:
        'The same editor News posts and Updates use: bold, italic, links, lists, pictures, and file attachments families can download.',
    }),
    defineField({
      name: 'tone',
      title: 'Colour',
      type: 'string',
      group: 'content',
      options: { list: SPOTLIGHT_TONES, layout: 'radio' },
      initialValue: 'info',
      description:
        'The colour of the pop-up’s edge. These four are the only choices because each is checked for readability in light and dark mode.',
    }),
    iconField('icon', {
      group: 'content',
      description: 'A little picture shown beside the heading (optional).',
    }),
    defineField({
      name: 'image',
      title: 'Picture (optional)',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'A short description of the picture, for screen readers.',
        }),
      ],
      description: 'A flyer or photo shown across the top of the pop-up.',
    }),

    // ---- The button ---------------------------------------------------------
    defineField({
      name: 'linkLabel',
      title: 'Button text (optional)',
      type: 'string',
      group: 'button',
      description: 'e.g. "See the supply lists". Leave blank for no button.',
    }),
    defineField({
      name: 'linkKind',
      title: 'The button goes to',
      type: 'string',
      group: 'button',
      options: {
        list: [
          { title: 'Page that came with the site', value: 'builtin' },
          { title: 'Page you made', value: 'hubPage' },
          { title: 'An update', value: 'update' },
          { title: 'Outside link', value: 'url' },
          { title: 'The merch store', value: 'store' },
        ],
        layout: 'radio',
      },
      initialValue: 'builtin',
      hidden: ({ parent }) => noButton(parent),
    }),
    defineField({
      name: 'builtinHref',
      title: 'Which page',
      type: 'string',
      group: 'button',
      options: { list: BUILTIN_HUB_LINKS.map((l) => ({ title: l.label, value: l.href })) },
      hidden: ({ parent }) => !isKind(parent, 'builtin'),
      validation: (R) =>
        R.custom((value, context) => {
          if (!isKind(context.parent, 'builtin')) return true;
          if (!value) return 'Pick which page the button opens.';
          return BUILTIN_HUB_LINKS.some((l) => l.href === value)
            ? true
            : 'This page no longer exists. Pick another one.';
        }),
    }),
    defineField({
      name: 'page',
      title: 'Which page',
      type: 'reference',
      to: [{ type: 'hubPage' }],
      group: 'button',
      // Only free-standing Board pages: a built-in page is picked above, by
      // its real route (the same split the Family Hub menu uses).
      options: { filter: 'defined(slug) && !defined(hubKey)' },
      hidden: ({ parent }) => !isKind(parent, 'hubPage'),
      validation: (R) =>
        R.custom((value, context) =>
          !isKind(context.parent, 'hubPage') || value ? true : 'Pick which page the button opens.',
        ),
    }),
    defineField({
      name: 'update',
      title: 'Which update',
      type: 'reference',
      to: [{ type: 'update' }],
      group: 'button',
      // An update needs its own web address before it can be linked to.
      options: { filter: 'defined(slug.current)' },
      hidden: ({ parent }) => !isKind(parent, 'update'),
      description: 'The update opens on its own page. Give the update a web address first.',
      validation: (R) =>
        R.custom((value, context) =>
          !isKind(context.parent, 'update') || value ? true : 'Pick which update the button opens.',
        ),
    }),
    defineField({
      name: 'url',
      title: 'Address',
      type: 'url',
      group: 'button',
      description: 'A full link starting with https://',
      hidden: ({ parent }) => !isKind(parent, 'url'),
      validation: (R) =>
        R.uri({ scheme: ['http', 'https'] }).custom((value, context) =>
          !isKind(context.parent, 'url') || value ? true : 'Paste a full web address.',
        ),
    }),

    // ---- When it shows ------------------------------------------------------
    defineField({
      name: 'active',
      title: 'Turn it on',
      type: 'boolean',
      group: 'timing',
      initialValue: false,
      description: 'The master switch. Off means it never shows, whatever the dates say.',
    }),
    defineField({
      name: 'version',
      title: 'Show it again to everyone',
      type: 'string',
      group: 'timing',
      initialValue: 'v1',
      description:
        'Families see a pop-up once, then it stays closed. After a big edit, type anything new here (e.g. "v2") and everyone sees it one more time.',
      validation: (R) => R.required().error('Give it a version stamp, e.g. "v1".'),
    }),
    defineField({
      name: 'showFrom',
      title: 'Start showing (optional)',
      type: 'datetime',
      group: 'timing',
      description: 'Leave blank to start right away. Set a date to have it appear on its own.',
    }),
    defineField({
      name: 'showUntil',
      title: 'Stop showing (optional)',
      type: 'datetime',
      group: 'timing',
      description: 'Leave blank to keep showing. Set a date to have it stop on its own.',
    }),
    // Drag-to-reorder in the Studio list. The order you set IS the order
    // families page through when more than one is switched on.
    orderRankField({ type: 'hubSpotlight' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: {
      title: 'title',
      heading: 'heading',
      active: 'active',
      version: 'version',
      showFrom: 'showFrom',
      showUntil: 'showUntil',
      media: 'image',
    },
    prepare({ title, heading, active, version, showFrom, showUntil, media }) {
      const now = Date.now();
      const from = showFrom ? new Date(showFrom).getTime() : -Infinity;
      const until = showUntil ? new Date(showUntil).getTime() : Infinity;
      let dot = '⚪ Off';
      if (active) dot = now < from ? '⏳ Scheduled' : now > until ? '⌛ Ended' : '🟢 Showing now';
      return {
        title: title || heading || 'Spotlight pop-up',
        subtitle: `${dot}${version ? ` · version: ${version}` : ''}`,
        media,
      };
    },
  },
});
