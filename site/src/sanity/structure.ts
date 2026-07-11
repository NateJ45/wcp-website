import type { StructureResolver, StructureBuilder } from 'sanity/structure';
import type { ComponentType } from 'react';
import { guides } from './guides/content';
import { makeGuideView } from './components/GuideView';

// =============================================================================
// Studio structure — the left-hand navigation a volunteer sees
// =============================================================================
// Deliberately organized so the important things are one click away and grouped
// by what they are, not dumped in one long alphabetical list. Singletons (Site
// Settings, Tuition & Fees) open straight into their single editor.
//
// Icons are plain emoji (friendly, and matches the schema icons) — Astro 7's
// bundler doesn't tree-shake the @sanity/icons barrel cleanly.
// =============================================================================

const emoji =
  (glyph: string): ComponentType =>
  () =>
    glyph;

// The "Help & Guide" center — a folder of read-only walkthrough panes, built
// from the guides data. Volunteers cannot edit or delete it.
function howThisWorks(S: StructureBuilder) {
  return S.listItem()
    .id('help-and-guide')
    .title('Help & Guide')
    .icon(emoji('❔'))
    .child(
      S.list()
        .id('help-and-guide-list')
        .title('Help & Guide')
        .items(
          guides.map((g) =>
            S.listItem()
              .id(`guide-${g.slug}`)
              .title(g.title)
              .icon(emoji(g.icon))
              .child(
                // Cast: our pane ignores props, but S.component wants the pane type.
                S.component(makeGuideView(g.slug) as never)
                  .id(`guide-view-${g.slug}`)
                  .title(g.title),
              ),
          ),
        ),
    );
}

// A singleton list item: one document, opens directly into its form.
function singleton(S: StructureBuilder, schemaType: string, title: string, icon: ComponentType) {
  return S.listItem()
    .title(title)
    .id(schemaType)
    .icon(icon)
    .child(S.document().schemaType(schemaType).documentId(schemaType).title(title));
}

// Everything placed explicitly below — kept out of the fallback list.
const PLACED = new Set([
  'siteSettings',
  'feeSchedule',
  'class',
  'staff',
  'faqItem',
  'testimonial',
  'schoolYearEvent',
  'legalPage',
  'page',
  'coopRole',
  'update',
  'hubDocument',
  'classNote',
  'directoryEntry',
]);

export const structure: StructureResolver = (S) =>
  S.list()
    .title('West Chester Preschool')
    .items([
      howThisWorks(S),

      S.divider(),

      singleton(S, 'siteSettings', 'Site Settings', emoji('⚙️')),

      // Page words — hero copy + legal pages
      S.listItem()
        .title('Pages')
        .id('pages')
        .icon(emoji('📄'))
        .child(
          S.list()
            .title('Pages')
            .items([
              S.documentTypeListItem('page').title('Page copy').icon(emoji('📝')),
              S.documentTypeListItem('legalPage').title('Legal pages').icon(emoji('📜')),
            ]),
        ),

      S.divider(),

      S.documentTypeListItem('class').title('Classes').icon(emoji('🎒')),
      S.documentTypeListItem('staff').title('Staff').icon(emoji('👩‍🏫')),
      singleton(S, 'feeSchedule', 'Tuition & Fees', emoji('💳')),
      S.documentTypeListItem('faqItem').title('FAQs').icon(emoji('❓')),
      S.documentTypeListItem('testimonial').title('Testimonials').icon(emoji('💬')),
      S.documentTypeListItem('schoolYearEvent').title('School-Year Events').icon(emoji('📅')),

      S.divider(),

      // Family Hub — the gated, families-only content
      S.listItem()
        .title('Family Hub')
        .id('family-hub')
        .icon(emoji('🔒'))
        .child(
          S.list()
            .title('Family Hub')
            .items([
              S.documentTypeListItem('update').title('Updates').icon(emoji('📣')),
              S.documentTypeListItem('hubDocument').title('Documents & Forms').icon(emoji('📄')),
              S.documentTypeListItem('classNote').title('Class Notes').icon(emoji('📓')),
              S.documentTypeListItem('directoryEntry').title('Family Directory').icon(emoji('👪')),
              S.documentTypeListItem('coopRole').title('Co-op Roles').icon(emoji('🤝')),
            ]),
        ),

      // Fallback: any type not explicitly placed above still shows up here.
      ...S.documentTypeListItems().filter((item) => !PLACED.has(item.getId() as string)),
    ]);
