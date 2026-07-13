import type { StructureResolver, StructureBuilder } from 'sanity/structure';
import type { ComponentType } from 'react';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { guides } from './guides/content';
import { makeGuideView } from './components/GuideView';
import { WelcomePane } from './components/WelcomePane';

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
  'navigation',
  'closureAlert',
  'feeSchedule',
  'class',
  'staff',
  'faqItem',
  'testimonial',
  'schoolYearEvent',
  'legalPage',
  'page',
  'post',
  'event',
  'submission',
  'subscriber',
  'coopRole',
  'program',
  'boardMember',
  'partner',
  'credential',
  'campaign',
  'jobPosting',
  'resource',
  'photoAlbum',
  'update',
  'hubDocument',
  'teacherNote',
  'directoryEntry',
  'hubPage',
  'presidentNote',
]);

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('West Chester Preschool')
    .items([
      S.listItem()
        .id('welcome')
        .title('Welcome')
        .icon(emoji('🏠'))
        .child(
          S.component(WelcomePane as never)
            .id('welcome-pane')
            .title('Welcome'),
        ),

      howThisWorks(S),

      S.divider(),

      singleton(S, 'closureAlert', 'Alert banner', emoji('🚨')),
      singleton(S, 'siteSettings', 'Site Settings', emoji('⚙️')),
      singleton(S, 'navigation', 'Menus (header & footer)', emoji('🧭')),

      // Pages — the page builder. "Pages" holds every public page as an
      // ordered stack of sections a volunteer can add / reorder / edit (and
      // "＋ Create" makes a brand-new page). Legal pages keep their own simple
      // long-form editor.
      S.listItem()
        .title('Pages')
        .id('pages')
        .icon(emoji('📄'))
        .child(
          S.list()
            .title('Pages')
            .items([
              S.documentTypeListItem('page').title('Pages (section builder)').icon(emoji('🧱')),
              S.documentTypeListItem('legalPage').title('Legal pages').icon(emoji('📜')),
            ]),
        ),

      S.documentTypeListItem('post').title('News').icon(emoji('📰')),
      S.documentTypeListItem('event').title('Events').icon(emoji('📅')),

      S.divider(),

      // Drag-to-reorder lists (orderable-document-list): the order you set by
      // dragging is exactly the order the site shows.
      orderableDocumentListDeskItem({
        type: 'class',
        S,
        context,
        title: 'Classes',
        icon: emoji('🎒'),
      }),
      S.documentTypeListItem('staff').title('Staff').icon(emoji('👩‍🏫')),
      singleton(S, 'feeSchedule', 'Tuition & Fees', emoji('💳')),
      S.documentTypeListItem('faqItem').title('FAQs').icon(emoji('❓')),
      orderableDocumentListDeskItem({
        type: 'testimonial',
        S,
        context,
        title: 'Testimonials',
        icon: emoji('💬'),
      }),
      orderableDocumentListDeskItem({
        type: 'schoolYearEvent',
        S,
        context,
        title: 'School-Year Events',
        icon: emoji('📅'),
      }),
      S.documentTypeListItem('submission').title('Form submissions').icon(emoji('📨')),
      S.documentTypeListItem('subscriber').title('Newsletter subscribers').icon(emoji('✉️')),

      S.divider(),

      // Community & content — the future-proofing collections that feed the
      // Programs / Board / Logo strip / Campaign / Jobs / Downloads / Album
      // page-builder sections. Drag to reorder the list-style ones.
      S.listItem()
        .title('Community & content')
        .id('community')
        .icon(emoji('🌟'))
        .child(
          S.list()
            .title('Community & content')
            .items([
              orderableDocumentListDeskItem({
                type: 'program',
                S,
                context,
                title: 'Programs',
                icon: emoji('🧩'),
              }),
              orderableDocumentListDeskItem({
                type: 'boardMember',
                S,
                context,
                title: 'Board / leadership',
                icon: emoji('🧑‍💼'),
              }),
              orderableDocumentListDeskItem({
                type: 'partner',
                S,
                context,
                title: 'Partners / sponsors',
                icon: emoji('🤝'),
              }),
              orderableDocumentListDeskItem({
                type: 'credential',
                S,
                context,
                title: 'Accreditations',
                icon: emoji('🏅'),
              }),
              orderableDocumentListDeskItem({
                type: 'jobPosting',
                S,
                context,
                title: 'Job postings',
                icon: emoji('📋'),
              }),
              orderableDocumentListDeskItem({
                type: 'resource',
                S,
                context,
                title: 'Downloads & resources',
                icon: emoji('📁'),
              }),
              S.documentTypeListItem('campaign').title('Fundraising campaigns').icon(emoji('💛')),
              S.documentTypeListItem('photoAlbum').title('Photo albums').icon(emoji('📸')),
            ]),
        ),

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
              S.documentTypeListItem('hubPage').title('Hub pages (edit content)').icon(emoji('🧱')),
              singleton(S, 'presidentNote', "President's note", emoji('💌')),
              S.documentTypeListItem('update').title('Updates').icon(emoji('📣')),
              S.documentTypeListItem('hubDocument').title('Documents & Forms').icon(emoji('📄')),
              S.documentTypeListItem('teacherNote')
                .title('Teacher welcome notes')
                .icon(emoji('💌')),
              S.documentTypeListItem('directoryEntry').title('Family Directory').icon(emoji('👪')),
              orderableDocumentListDeskItem({
                type: 'coopRole',
                S,
                context,
                title: 'Co-op Roles',
                icon: emoji('🤝'),
              }),
            ]),
        ),

      // Fallback: any type not explicitly placed above still shows up here.
      ...S.documentTypeListItems().filter((item) => !PLACED.has(item.getId() as string)),
    ]);
