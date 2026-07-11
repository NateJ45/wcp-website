import { defineType, defineField } from 'sanity';

// Documents & Forms — handbook, bylaws, required state forms, meeting minutes.
// A document is either an external link (Drive/Canva) or an uploaded file.
export const hubDocument = defineType({
  name: 'hubDocument',
  title: 'Document / Form',
  type: 'document',
  icon: () => '📄',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Required Form', value: 'required' },
          { title: 'Handbook & Policy', value: 'handbook' },
          { title: 'Orientation Material', value: 'orient' },
          { title: 'Meeting Minutes', value: 'minutes' },
        ],
        layout: 'dropdown',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Note',
      description: 'Optional one-line context shown under the title.',
      type: 'string',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      description: 'Icon name shown next to this document, e.g. "file-text", "shield-check".',
      type: 'string',
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
      hidden: ({ parent }) => parent?.sourceType !== 'link',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      hidden: ({ parent }) => parent?.sourceType !== 'file',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      description: 'Lower numbers show first within a category.',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Category, then order',
      name: 'grouped',
      by: [
        { field: 'category', direction: 'asc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' },
  },
});
