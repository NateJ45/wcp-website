import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// Merch store card (SINGLETON) — the store card on the Family Hub home
// =============================================================================
// The store link, headline, blurb, and featured-merch tiles for the card at
// the bottom of the hub home. These four fields lived in Site Settings'
// "Social & store" group until 2026-08-23; they moved here so hub content
// lives in the Family Hub workspace (scripts/patch-hub-store.mjs copied the
// values over). Only the hub home reads this document.
// =============================================================================
export const hubStore = defineType({
  name: 'hubStore',
  title: 'Merch store card',
  type: 'document',
  icon: () => '🛍️',
  fields: [
    defineField({
      name: 'storeUrl',
      title: 'Merch store link',
      type: 'url',
      description: 'The online store link (opens in a new tab).',
    }),
    defineField({
      name: 'storeHeadline',
      title: 'Store card headline',
      type: 'string',
      description: 'The big line on the store card at the bottom of the Family Hub home.',
    }),
    defineField({
      name: 'storeTagline',
      title: 'Store card blurb',
      type: 'text',
      rows: 2,
      description: 'The supporting sentence under the headline.',
    }),
    defineField({
      name: 'shippingLine',
      title: 'Shipping perk line',
      type: 'string',
      description:
        'The little chip on the store card, e.g. "Free shipping on orders $100+". Keep it in step with the store’s actual shipping settings; empty keeps the shipped wording.',
    }),
    defineField({
      name: 'featuredCollection',
      title: 'Lead collection name',
      type: 'string',
      description:
        'Which store collection shows first on the card. Must match the collection’s name in the store, e.g. "Featured". Empty keeps "Featured".',
    }),
    defineField({
      name: 'salesRowName',
      title: 'Treasurer-sheet row name',
      type: 'string',
      description:
        'The row in the treasurer’s tracking sheet that holds store/merch sales, e.g. "Shirt Sales". The Fundraising page swaps that row for the store’s live total — if the treasurer renames the row, update this to match or the money counts twice.',
    }),
    defineField({
      name: 'salesGoal',
      title: 'Store sales goal ($)',
      type: 'number',
      description:
        'Fallback yearly goal for store sales when the treasurer’s sheet has no merch row. Empty keeps $150.',
    }),
    defineField({
      name: 'openedLabel',
      title: '"Selling since" label',
      type: 'string',
      description:
        'Shown under the store’s live total on the Fundraising page, e.g. "since May 1, 2026".',
    }),
    defineField({
      name: 'storeProducts',
      title: 'Featured merch',
      type: 'array',
      description:
        'A few items to show as clickable tiles on the Family Hub store card. Add, remove, and drag to reorder. Leave empty to show just the card.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Name', type: 'string' }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'string',
              description: 'e.g. "$24.99".',
            }),
            defineField({ name: 'url', title: 'Product link', type: 'url' }),
            defineField({
              name: 'photo',
              title: 'Product photo',
              type: 'image',
              options: { hotspot: true },
              description: 'Upload the product photo (save it from the store page first).',
            }),
            // Legacy hotlinked photo URL — those store links expire, which is
            // why this became a real upload (field audit 2026-08-23;
            // patch-hub-store-photos.mjs converted the existing eight).
            // Kept hidden as the render fallback for anything unconverted.
            defineField({
              name: 'image',
              title: 'Image URL (old)',
              type: 'url',
              hidden: true,
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'price', imageUrl: 'image' } },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Merch store card', subtitle: 'The store card on the hub home' }),
  },
});
