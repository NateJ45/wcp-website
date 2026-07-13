import { defineType, defineField } from 'sanity';
import { iconField } from '../objects/_shared';

// =============================================================================
// announcement — a site-wide bar or popup the board turns on/off (public site)
// =============================================================================
// Multiple of these can exist; each is one top bar OR one popup, with a master
// on/off, optional show-from / show-until dates, and a priority for stacking.
// The "＋ New" menu offers pre-built starting points (see sanity.config
// templates). The urgent snow-day banner is a SEPARATE, always-on-top thing
// (the Alert banner singleton) — this is the planned / marketing layer.
//
// The "Enrollment / waitlist" template composes its message from the live class
// availability data (Site Settings availability sheet), so it stays current.
// =============================================================================

export const ANNOUNCEMENT_TEMPLATES = [
  { title: 'Custom message', value: 'custom' },
  { title: 'Enrollment / waitlist status', value: 'waitlist' },
  { title: 'Event coming up (open house, tour)', value: 'event' },
  { title: 'Fundraiser push', value: 'fundraiser' },
  { title: 'General notice', value: 'notice' },
  { title: 'Welcome / new families', value: 'welcome' },
];

export const ANNOUNCEMENT_TONES = [
  { title: 'Info (navy)', value: 'info' },
  { title: 'Good news (green)', value: 'good' },
  { title: 'Heads-up (amber)', value: 'warning' },
  { title: 'Urgent (red)', value: 'urgent' },
  { title: 'Brand (cream)', value: 'brand' },
];

export const announcement = defineType({
  name: 'announcement',
  title: 'Announcement',
  type: 'document',
  icon: () => '📢',
  groups: [
    { name: 'content', title: 'What it says', default: true },
    { name: 'timing', title: 'When it shows' },
    { name: 'placement', title: 'Where it shows' },
    { name: 'popup', title: 'Popup settings' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Name (just for you)',
      type: 'string',
      group: 'content',
      description: 'A label so you can find it in the list, e.g. "Fall open house bar".',
      validation: (R) => R.required().error('Give it a name so you can find it in the list.'),
    }),
    defineField({
      name: 'format',
      title: 'Show it as',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'A bar across the top of the page', value: 'bar' },
          { title: 'A popup in the middle of the screen', value: 'popup' },
        ],
        layout: 'radio',
      },
      initialValue: 'bar',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'template',
      title: 'Type',
      type: 'string',
      group: 'content',
      options: { list: ANNOUNCEMENT_TEMPLATES, layout: 'dropdown' },
      initialValue: 'custom',
      description:
        'Pick "Enrollment / waitlist status" to fill the message automatically from your class availability sheet.',
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 2,
      group: 'content',
      description:
        'The words shown. For the waitlist type you can leave this blank to fill it automatically, or type your own to override.',
      validation: (R) =>
        R.custom((value, context) => {
          const doc = context.document as { template?: string } | undefined;
          if (doc?.template === 'waitlist') return true; // auto-filled
          return value && value.trim() ? true : 'Write the message this shows.';
        }),
    }),
    defineField({
      name: 'tone',
      title: 'Color',
      type: 'string',
      group: 'content',
      options: { list: ANNOUNCEMENT_TONES, layout: 'radio' },
      initialValue: 'info',
    }),
    iconField('icon', {
      group: 'content',
      description: 'A little picture shown before the message (optional).',
    }),
    defineField({
      name: 'linkLabel',
      title: 'Button text (optional)',
      type: 'string',
      group: 'content',
      description: 'e.g. "Register here". Leave blank for no button.',
    }),
    defineField({
      name: 'linkType',
      title: 'Button goes to',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'A page on this site', value: 'page' },
          { title: 'A web address', value: 'url' },
        ],
        layout: 'radio',
      },
      initialValue: 'page',
      hidden: ({ parent }) => !parent?.linkLabel,
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{ type: 'page' }],
      group: 'content',
      hidden: ({ parent }) => !parent?.linkLabel || parent?.linkType === 'url',
    }),
    defineField({
      name: 'url',
      title: 'Web address',
      type: 'url',
      group: 'content',
      description: 'A full https:// link.',
      hidden: ({ parent }) => !parent?.linkLabel || parent?.linkType !== 'url',
      validation: (R) =>
        R.uri({ scheme: ['http', 'https'] }).error('Paste a full link starting with https://'),
    }),

    // When it shows
    defineField({
      name: 'enabled',
      title: 'Turn it on',
      type: 'boolean',
      group: 'timing',
      initialValue: false,
      description: 'The master switch. Off = never shows, no matter the dates.',
    }),
    defineField({
      name: 'showFrom',
      title: 'Start showing (optional)',
      type: 'datetime',
      group: 'timing',
      description: 'Leave blank to show right away. Set a date to have it appear on its own later.',
    }),
    defineField({
      name: 'showUntil',
      title: 'Stop showing (optional)',
      type: 'datetime',
      group: 'timing',
      description: 'Leave blank to keep showing. Set a date to have it disappear on its own.',
    }),
    defineField({
      name: 'priority',
      title: 'Order',
      type: 'number',
      group: 'timing',
      initialValue: 10,
      description:
        'When several bars are on, lower numbers show first (at the top). For popups, the lowest number wins if several are on.',
    }),

    // Where it shows
    defineField({
      name: 'placement',
      title: 'Which pages',
      type: 'string',
      group: 'placement',
      options: {
        list: [
          { title: 'Every page', value: 'all' },
          { title: 'Only the pages I choose', value: 'only' },
          { title: 'Every page except the ones I choose', value: 'except' },
        ],
        layout: 'radio',
      },
      initialValue: 'all',
    }),
    defineField({
      name: 'pages',
      title: 'Pages',
      type: 'array',
      group: 'placement',
      of: [{ type: 'reference', to: [{ type: 'page' }] }],
      hidden: ({ parent }) => !parent?.placement || parent?.placement === 'all',
      description: 'Pick the pages this applies to.',
    }),

    // Popup settings
    defineField({
      name: 'frequency',
      title: 'How often to show it',
      type: 'string',
      group: 'popup',
      options: {
        list: [
          { title: 'Once per visitor (until you change it)', value: 'once' },
          { title: 'Once each visit (per browser session)', value: 'session' },
          { title: 'Every page load', value: 'always' },
        ],
        layout: 'radio',
      },
      initialValue: 'once',
      hidden: ({ parent }) => parent?.format !== 'popup',
    }),
    defineField({
      name: 'version',
      title: 'Version stamp',
      type: 'string',
      group: 'popup',
      description:
        'Change this (e.g. "v2") after editing to show the popup again to people who already dismissed it.',
      hidden: ({ parent }) => parent?.format !== 'popup',
    }),
    defineField({
      name: 'image',
      title: 'Image (optional)',
      type: 'image',
      options: { hotspot: true },
      group: 'popup',
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      hidden: ({ parent }) => parent?.format !== 'popup',
    }),
    defineField({
      name: 'heading',
      title: 'Popup heading (optional)',
      type: 'string',
      group: 'popup',
      description: 'A bold title at the top of the popup.',
      hidden: ({ parent }) => parent?.format !== 'popup',
    }),
  ],
  orderings: [
    { title: 'Order (priority)', name: 'priority', by: [{ field: 'priority', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      format: 'format',
      enabled: 'enabled',
      showFrom: 'showFrom',
      showUntil: 'showUntil',
    },
    prepare({ title, format, enabled, showFrom, showUntil }) {
      const now = Date.now();
      const from = showFrom ? new Date(showFrom).getTime() : -Infinity;
      const until = showUntil ? new Date(showUntil).getTime() : Infinity;
      const inWindow = now >= from && now <= until;
      let dot = '⚪ Off';
      if (enabled) dot = inWindow ? '🟢 Showing now' : now < from ? '⏳ Scheduled' : '⌛ Ended';
      return {
        title: title || 'Announcement',
        subtitle: `${dot} · ${format === 'popup' ? 'Popup' : 'Bar'}`,
      };
    },
  },
});
