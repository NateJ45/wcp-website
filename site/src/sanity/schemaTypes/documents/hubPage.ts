import { defineType, defineField, defineArrayMember } from 'sanity';
import { HUB_SECTION_TYPE_NAMES, sectionInsertMenu } from '../sections';
import { ICON_NAMES } from '../objects/_shared';
import { RESERVED_HUB_SLUGS } from '../../../lib/hub-pages';
import { PUBLISH_AT_GROUP, publishAtField } from '../_publishAt';

// =============================================================================
// hubPage — a Family Hub page, built from sections (GATED, editable)
// =============================================================================
// The gated hub pages read one of these by `hubKey` at request time. Volunteers
// edit the heading, intro, and a stack of sections just like the public pages,
// but from the hub-safe palette (no build-time "pull" sections). Each page also
// renders its fixed widget (calendar embed, PayPal, directory map, live
// campaign bars, class facts) in code — those stay locked; the sections wrap
// around them. If no hubPage doc exists for a key yet, the page shows its
// built-in fallback content, so the hub can never go blank.
// =============================================================================
export const hubPage = defineType({
  name: 'hubPage',
  title: 'Family Hub page',
  type: 'document',
  icon: () => '🔒',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'settings', title: 'Settings' },
    // "Publish automatically at" — the free-tier scheduled publish. The group
    // and the field are one unit; see ../_publishAt.ts.
    PUBLISH_AT_GROUP,
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page name (internal)',
      type: 'string',
      group: 'settings',
      description: 'Just so you can find it in the list, e.g. "Health" or "Fundraising".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'hubKey',
      title: 'Which hub page',
      type: 'string',
      group: 'settings',
      description:
        'Only for the pages that came with the site. Pick the one this content belongs to, and set it once — do not change it later. Making a BRAND-NEW page instead? Leave this empty and fill in the web address below.',
      options: {
        list: [
          { title: 'Hub home', value: 'home' },
          { title: 'Calendar', value: 'calendar' },
          { title: 'Co-op Jobs', value: 'coop-jobs' },
          { title: 'Documents', value: 'documents' },
          { title: 'Tuition', value: 'tuition' },
          { title: 'Updates', value: 'updates' },
          { title: 'Fundraising', value: 'fundraising' },
          { title: 'Health', value: 'health' },
          { title: 'Directory', value: 'directory' },
          // One entry per PAGE (both class pairs share one page each; the
          // per-class keys were merged away 2026-08-24).
          { title: 'Twos & Threes classroom', value: 'twos-threes' },
          { title: 'Pre-K classroom', value: 'pre-k' },
        ],
      },
    }),

    // --- New pages ----------------------------------------------------------
    defineField({
      name: 'slug',
      title: 'Web address (new pages only)',
      type: 'string',
      group: 'settings',
      description:
        'Lowercase words joined by hyphens, e.g. "playground-committee". The page will live at /family-hub/playground-committee. Leave empty for a page that came with the site.',
      // A plain string + regex, not Sanity's slug type: the same reason the
      // public pages use one (slugify strips characters we depend on), plus we
      // can spell out the rule in the error a volunteer actually reads.
      validation: (R) =>
        R.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
          name: 'web address',
          invert: false,
        })
          .error('Use lowercase letters, numbers and hyphens only — e.g. "playground-committee".')
          .custom(async (slug, context) => {
            const value = typeof slug === 'string' ? slug.trim() : '';
            if (!value) return true;

            // A page that came with the site already owns this address. Astro
            // serves the real route first, so this page would simply never
            // appear — silent, and baffling to whoever made it.
            if (RESERVED_HUB_SLUGS.includes(value)) {
              return `“${value}” is already used by a page that came with the site. Pick a different web address.`;
            }

            // Two pages at one address: the site can only serve one of them,
            // and which one it picks is arbitrary. Catch it here instead.
            const id = context.document?._id?.replace(/^drafts\./, '') ?? '';
            const client = context.getClient({ apiVersion: '2025-01-01' });
            const taken = await client.fetch<string | null>(
              `*[_type == "hubPage" && slug == $slug && !(_id in [$id, "drafts." + $id])][0].title`,
              { slug: value, id },
            );
            if (taken) {
              return `“${value}” is already used by the page “${taken}”. Pick a different web address.`;
            }

            // Every class already has a hub page at its own address, whether or
            // not anyone made one (src/lib/hub-classrooms.ts). A page taking a
            // class's address would never show, because the class page answers
            // there first — UNLESS this page IS that class's classroom page,
            // which is exactly how a new class gets a handbook.
            const owner = await client.fetch<string | null>(
              `*[_type == "class" && slug.current == $slug][0].name`,
              { slug: value },
            );
            if (owner) {
              const mine = ((context.document as { classes?: { _ref?: string }[] })?.classes ?? [])
                .map((r) => r?._ref)
                .filter(Boolean);
              const isMine =
                mine.length > 0 &&
                (await client.fetch<boolean>(
                  `count(*[_type == "class" && slug.current == $slug && _id in $ids]) > 0`,
                  { slug: value, ids: mine },
                ));
              if (!isMine) {
                return `“${value}” is the ${owner} class's own page address. Add ${owner} under “Classes on this page” to make this its classroom page, or pick a different web address.`;
              }
            }
            return true;
          }),
    }),
    // --- Classroom pages ----------------------------------------------------
    // A hub page becomes the CLASSROOM page for the classes named here. Twos
    // and Threes share one (same teacher, same handbook), and so do Pre-K AM
    // and PM. A class that no page names still gets a hub page — the site
    // builds it from the class entry alone — so this field is only for putting
    // two or more classes together, or for giving one class a handbook.
    defineField({
      name: 'classes',
      title: 'Classes on this page',
      type: 'array',
      group: 'settings',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'class' }] })],
      description:
        'Leave empty for a normal page. Pick one or more classes to make this their classroom page: the class facts, teacher, pay button and photo album appear at the top, and everything you add below becomes their handbook. Classes that share a teacher and a handbook go on one page together.',
      validation: (R) =>
        R.custom(async (value, context) => {
          const refs = (value ?? []) as { _ref?: string }[];
          if (refs.length === 0) return true;

          // Two pages claiming one class: the site can only show it on one, so
          // catch it here instead of letting the other page look broken.
          const id = context.document?._id?.replace(/^drafts\./, '') ?? '';
          const ids = refs.map((r) => r?._ref).filter(Boolean);
          const clash = await context
            .getClient({ apiVersion: '2025-01-01' })
            .fetch<{ title?: string; name?: string } | null>(
              `*[_type == "hubPage" && !(_id in [$id, "drafts." + $id]) && count(classes[@._ref in $ids]) > 0][0]{
                 title, "name": classes[@._ref in $ids][0]->name
               }`,
              { id, ids },
            );
          return clash
            ? `“${clash.name ?? 'That class'}” is already on the page “${clash.title ?? 'another hub page'}”. A class can only have one classroom page.`
            : true;
        }),
    }),

    defineField({
      name: 'navIcon',
      title: 'Page icon',
      type: 'string',
      group: 'settings',
      description:
        'The little picture at the top of the page, and beside its menu link if you add one (Family Hub menu).',
      options: { list: ICON_NAMES.map((v) => ({ title: v, value: v })) },
      initialValue: 'file-text',
    }),

    // The same soft archive the public pages have. An archived hub page drops
    // out of the hub (the built-in pages fall back to their shipped content)
    // but keeps every word, so Restore puts it back unchanged. Hub pages get no
    // "Search & sharing" group: they sit behind the family password, so no
    // search engine can ever read them.
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      group: 'settings',
      hidden: false,
      description:
        'Archived pages are removed from the site but kept here so they can be restored.',
    }),

    defineField({
      name: 'heading',
      title: 'Page heading',
      type: 'string',
      group: 'content',
      description: 'The big title at the top of the page.',
    }),
    defineField({
      name: 'intro',
      title: 'Intro line',
      type: 'text',
      rows: 2,
      group: 'content',
      description: 'The sentence under the heading.',
    }),
    defineField({
      name: 'handbookFile',
      title: 'Handbook PDF (optional)',
      type: 'file',
      group: 'content',
      options: { accept: 'application/pdf' },
      description:
        'The teacher’s own handbook, as a PDF. When set, a “Download the handbook (PDF)” button appears at the top of this class page. Class pages only.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      of: HUB_SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
      // The same grouped "+ Add" picker as public pages, trimmed to the
      // hub-safe palette (see sections/index.ts).
      options: sectionInsertMenu(HUB_SECTION_TYPE_NAMES),
      description: 'The page body. Add, remove, and drag to reorder sections.',
    }),

    // Keep the page a DRAFT and it publishes itself at this time (within the
    // half hour). scripts/publish-due.mjs does the work; see ../_publishAt.ts.
    // A hub page is read live at request time, so it is on the hub the moment
    // the script publishes it — no rebuild.
    publishAtField(),
  ],
  // A hubPage is EITHER a built-in page (hubKey) or a new one (slug). With
  // neither it is an orphan: nothing routes to it and it renders nowhere, which
  // is a confusing thing to let someone save and walk away from.
  validation: (R) =>
    R.custom((doc) => {
      const d = doc as { hubKey?: string; slug?: string } | undefined;
      if (d?.hubKey || d?.slug?.trim()) return true;
      return 'Pick which hub page this is, OR give it a web address to make it a new page.';
    }),
  preview: {
    select: { title: 'title', hubKey: 'hubKey', slug: 'slug', archived: 'archived' },
    prepare({ title, hubKey, slug, archived }) {
      const labels: Record<string, string> = {
        home: 'Hub home',
        calendar: 'Calendar',
        'coop-jobs': 'Co-op Jobs',
        documents: 'Documents',
        tuition: 'Tuition',
        updates: 'Updates',
        fundraising: 'Fundraising',
        health: 'Health',
        directory: 'Directory',
        'twos-threes': 'Twos & Threes classroom',
        'pre-k': 'Pre-K classroom',
      };
      const where = hubKey
        ? (labels[hubKey] ?? hubKey)
        : slug
          ? `New page · /family-hub/${slug}`
          : 'Not set up yet — pick a page, or give it a web address';
      return {
        title: title || '(untitled hub page)',
        subtitle: archived ? `Archived · ${where}` : where,
      };
    },
  },
});
