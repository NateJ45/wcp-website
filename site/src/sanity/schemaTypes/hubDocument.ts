import { defineType, defineField } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { iconField } from './objects/_shared';

// ONE list with the Documents page's grouping — src/lib/hub-doc-categories.ts.
// The page renders any value it does not recognize too, so a category added
// here (or a legacy value) is never silently dropped.
import { HUB_DOC_CATEGORIES } from '../../lib/hub-doc-categories';

// Documents & Forms — handbook, bylaws, required state forms, meeting minutes.
// A document is either an external link (Drive/Canva) or an uploaded file.
export const hubDocument = defineType({
  name: 'hubDocument',
  title: 'Document / Form',
  type: 'document',
  icon: () => '📄',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (R) => R.required().error('Give the document a title families will recognize.'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: HUB_DOC_CATEGORIES,
        layout: 'dropdown',
      },
      validation: (R) =>
        R.required().error('Pick which section of Documents & Forms this belongs in.'),
    }),
    defineField({
      name: 'description',
      title: 'Note',
      description: 'Optional one-line context shown under the title.',
      type: 'string',
    }),
    iconField('icon', {
      description: 'The little picture shown next to this document (optional).',
    }),
    defineField({
      name: 'sourceType',
      title: 'This document is…',
      type: 'string',
      options: {
        list: [
          { title: 'A link (Google Drive, Canva, etc.)', value: 'link' },
          { title: 'An uploaded file', value: 'file' },
        ],
        layout: 'radio',
      },
      initialValue: 'link',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'url',
      description: 'Paste the full link, e.g. a Google Drive share link.',
      hidden: ({ parent }) => parent?.sourceType !== 'link',
      validation: (R) =>
        R.uri({ scheme: ['http', 'https'] }).error(
          'That doesn’t look like a link. Paste the full address, starting with https://',
        ),
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      description: 'Upload the file itself (PDF works best).',
      hidden: ({ parent }) => parent?.sourceType !== 'file',
    }),
    // Legacy manual sort — superseded by drag-to-reorder (orderRank), hidden.
    // The Documents page groups by category, so dragging reorders WITHIN a
    // category; the category shows in the list so that's clear.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
    orderRankField({ type: 'hubDocument' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: 'title', category: 'category' },
    prepare({ title, category }) {
      return {
        title,
        subtitle: HUB_DOC_CATEGORIES.find((c) => c.value === category)?.title ?? category,
      };
    },
  },
});
