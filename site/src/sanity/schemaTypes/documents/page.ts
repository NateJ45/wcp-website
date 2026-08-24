import { defineType, defineField, defineArrayMember } from 'sanity';
import { BODY_SECTION_TYPE_NAMES, sectionInsertMenu } from '../sections';

// Web addresses a page can never use: the FIRST slug segment must not collide
// with a code-owned route or a build-output folder. A colliding page would
// simply never appear (the built-in route wins) or would fight the build
// output — silent either way, and baffling to whoever made it. Same guard the
// hub pages have (RESERVED_HUB_SLUGS); found missing by the Babies page test
// (2026-08-24). Update this list when a new top-level route or public/ folder
// is added.
const RESERVED_PAGE_SLUGS: readonly string[] = [
  // Code-owned routes (src/pages/):
  '404',
  'api',
  'colophon',
  'enrollment-packet',
  'events',
  'family-hub',
  'news',
  'newsletter',
  'preview',
  'search',
  'studio',
  'thank-you',
  // Build-output folders (dist/client/):
  'curriculum',
  'hero',
  'ig',
  'og',
  'pagefind',
  'supplies',
];

// =============================================================================
// Page — a builder page (hero + a stack of sections)
// =============================================================================
// Every marketing page is one of these. The hero is a fixed field at the top
// (every page has exactly one); the body is a free stack of sections chosen
// from the palette. Create a new page here, compose it, give it a slug, add it
// to the Menus, and publish — it goes live on the next rebuild.
//
// `slug` is a plain string (NOT Sanity's slug type) so it can contain slashes
// like "classes/twos"; the regex keeps it URL-safe. "home" is the front page.
// =============================================================================
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: () => '📄',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'hero', title: 'Hero (top banner)' },
    { name: 'seo', title: 'Search & sharing' },
    { name: 'settings', title: 'Settings' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page name (internal)',
      type: 'string',
      group: 'settings',
      description: 'Just so you can find it in the list, e.g. "Home" or "About".',
      validation: (R) => R.required().error('Give the page a name so you can find it in the list.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address (slug)',
      type: 'string',
      group: 'settings',
      description:
        'The address after the domain, e.g. "about" → /about, "classes/twos" → /classes/twos. Use "home" for the front page. Lowercase, words separated by hyphens. Do not change an existing page\'s slug (it would break links).',
      validation: (R) =>
        R.required().custom(async (value, context) => {
          if (typeof value !== 'string') return 'Required';
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(value))
            return 'Use lowercase letters, numbers and hyphens (slashes allowed for sub-pages).';

          // A built-in part of the site already owns this address — the page
          // would silently never appear.
          const first = value.split('/')[0];
          if (RESERVED_PAGE_SLUGS.includes(first)) {
            return `“${first}” is already used by a built-in part of the site. Pick a different web address.`;
          }

          // Two pages at one address: the build can only emit one of them,
          // and which one wins is arbitrary. Catch it here instead.
          const id = context.document?._id?.replace(/^drafts\./, '') ?? '';
          const taken = await context
            .getClient({ apiVersion: '2025-01-01' })
            .fetch<string | null>(
              `*[_type == "page" && slug == $slug && !(_id in [$id, "drafts." + $id])][0].title`,
              { slug: value, id },
            );
          return taken
            ? `“${value}” is already used by the page “${taken}”. Pick a different web address.`
            : true;
        }),
    }),
    defineField({
      name: 'hero',
      title: 'Hero (top banner)',
      type: 'heroObject',
      group: 'hero',
      description: 'The big banner at the very top of the page: headline, photo, buttons.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      of: BODY_SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
      // The grouped, searchable "+ Add" picker (see sections/index.ts).
      options: sectionInsertMenu(BODY_SECTION_TYPE_NAMES),
      description: 'The page body. Add, remove, and drag to reorder sections.',
    }),
    defineField({
      name: 'seoTitle',
      title: 'Browser tab / search title',
      type: 'string',
      group: 'seo',
      description: 'What Google and the browser tab show. Leave blank to use the page name.',
      validation: (R) => R.max(65).warning('Titles over ~65 characters get cut off in Google.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description',
      type: 'text',
      rows: 2,
      group: 'seo',
      description: 'The sentence shown under this page in Google results.',
      validation: (R) =>
        R.max(160).warning('Descriptions over ~160 characters get cut off in search results.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image (optional)',
      type: 'image',
      options: { hotspot: true },
      group: 'seo',
      description:
        'The picture shown when this page is shared (texts, Facebook). Leave blank for the automatic card.',
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug', media: 'hero.image' },
    prepare({ title, slug, media }) {
      return { title: title || '(untitled page)', subtitle: slug ? `/${slug}` : undefined, media };
    },
  },
});
