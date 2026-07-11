import { defineType, defineField, defineArrayMember } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { iconField } from '../objects/_shared';

// =============================================================================
// Future-proofing document types
// =============================================================================
// program, boardMember, partner, credential, campaign, jobPosting, resource,
// photoAlbum. Each is listed/reused, so it's a document type (not just a page).
// They surface through the matching page-builder sections (community.ts).
//
// The list-style types carry an `orderRank` (via @sanity/orderable-document-list)
// so the board drag-reorders them in the Studio exactly like Classes and
// Testimonials — no number-field juggling. campaign (one active at a time) and
// photoAlbum (ordered by its own photos array) don't need a rank.
// =============================================================================

export const program = defineType({
  name: 'program',
  title: 'Program',
  type: 'document',
  description: 'An enrichment / summer / curriculum offering beyond the core age-classes.',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    iconField('icon'),
    defineField({ name: 'ageRange', title: 'Ages (optional)', type: 'string' }),
    defineField({ name: 'schedule', title: 'Schedule (optional)', type: 'string' }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3 }),
    defineField({ name: 'image', title: 'Image (optional)', type: 'figureImage' }),
    orderRankField({ type: 'program' }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'name', subtitle: 'ageRange', media: 'image' } },
});

export const boardMember = defineType({
  name: 'boardMember',
  title: 'Board / leadership',
  type: 'document',
  description: 'A public-facing officer or leader (separate from teaching Staff).',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g. President, Treasurer.',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'bio', title: 'Short bio (optional)', type: 'text', rows: 3 }),
    defineField({ name: 'photo', title: 'Photo (optional)', type: 'figureImage' }),
    defineField({ name: 'email', title: 'Email (optional)', type: 'string' }),
    orderRankField({ type: 'boardMember' }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
});

export const partner = defineType({
  name: 'partner',
  title: 'Partner / sponsor',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'figureImage',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'url', title: 'Website (optional)', type: 'url' }),
    orderRankField({ type: 'partner' }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'name', media: 'logo' } },
});

export const credential = defineType({
  name: 'credential',
  title: 'Accreditation / license',
  type: 'document',
  description: 'A trust badge — accreditation, state license, membership.',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'logo',
      title: 'Badge / logo',
      type: 'figureImage',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'url', title: 'Link (optional)', type: 'url' }),
    orderRankField({ type: 'credential' }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'name', media: 'logo' } },
});

export const campaign = defineType({
  name: 'campaign',
  title: 'Fundraising campaign',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'active',
      title: 'Currently running?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3 }),
    defineField({
      name: 'goalAmount',
      title: 'Goal ($)',
      type: 'number',
      validation: (R) => R.min(0),
    }),
    defineField({
      name: 'raisedAmount',
      title: 'Raised so far ($)',
      type: 'number',
      validation: (R) => R.min(0),
    }),
    defineField({ name: 'deadline', title: 'Deadline (optional)', type: 'date' }),
    defineField({
      name: 'linkLabel',
      title: 'Button text',
      type: 'string',
      initialValue: 'Donate',
    }),
    defineField({ name: 'linkUrl', title: 'Button link', type: 'string', initialValue: '/donate' }),
  ],
  preview: {
    select: { title: 'title', goal: 'goalAmount', raised: 'raisedAmount' },
    prepare({ title, goal, raised }) {
      const pct = goal ? Math.round(((raised ?? 0) / goal) * 100) : 0;
      return { title, subtitle: goal ? `$${raised ?? 0} of $${goal} (${pct}%)` : 'No goal set' };
    },
  },
});

export const jobPosting = defineType({
  name: 'jobPosting',
  title: 'Job posting',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'active',
      title: 'Currently open?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Teaching', value: 'teaching' },
          { title: 'Board / volunteer', value: 'board' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'teaching',
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 2 }),
    defineField({ name: 'body', title: 'Details', type: 'richProse' }),
    defineField({
      name: 'applyUrl',
      title: 'How to apply (link or mailto)',
      type: 'string',
      description: 'A full https:// link, or mailto:you@example.org.',
    }),
    orderRankField({ type: 'jobPosting' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: 'title', active: 'active', type: 'type' },
    prepare({ title, active, type }) {
      return { title: `${active ? '' : '(closed) '}${title}`, subtitle: type };
    },
  },
});

export const RESOURCE_CATEGORIES = [
  { title: 'Handbook & policies', value: 'handbook' },
  { title: 'Calendar', value: 'calendar' },
  { title: 'Enrollment & forms', value: 'forms' },
  { title: 'Other', value: 'other' },
];

export const resource = defineType({
  name: 'resource',
  title: 'Resource / download',
  type: 'document',
  description: 'A public download or link — handbook, calendar, forms.',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: RESOURCE_CATEGORIES, layout: 'radio' },
      initialValue: 'other',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'description', title: 'Description (optional)', type: 'string' }),
    defineField({ name: 'file', title: 'File (upload)', type: 'file' }),
    defineField({
      name: 'url',
      title: '…or a link instead',
      type: 'url',
      description: 'Use this instead of a file for an external link (e.g. a Google Doc).',
    }),
    orderRankField({ type: 'resource' }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'title', subtitle: 'category' } },
});

export const photoAlbum = defineType({
  name: 'photoAlbum',
  title: 'Photo album',
  type: 'document',
  description: 'A reusable set of photos (a classroom, an event) shown as a gallery.',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'description', title: 'Description (optional)', type: 'text', rows: 2 }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [defineArrayMember({ type: 'figureImage' })],
      validation: (R) => R.min(1),
    }),
  ],
  preview: {
    select: { title: 'title', photos: 'photos', media: 'photos.0' },
    prepare({ title, photos, media }) {
      const n = Array.isArray(photos) ? photos.length : 0;
      return { title, subtitle: `${n} photo${n === 1 ? '' : 's'}`, media };
    },
  },
});
