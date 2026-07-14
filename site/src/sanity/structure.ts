import type { StructureResolver, StructureBuilder } from 'sanity/structure';
import type { ComponentType } from 'react';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { guides } from './guides/content';
import { makeGuideView } from './components/GuideView';
import { WelcomePane } from './components/WelcomePane';

// =============================================================================
// Studio structure — the left-hand navigation a volunteer sees
// =============================================================================
// Organized by TASK frequency, not by document type: titled bands walk from
// "Everyday edits" (alert, money, news, events) through "School info" and the
// Family Hub down to "Site setup" and the read-only "Inboxes". Money lives in
// ONE place ("Money & payments": fee schedule + class tuition + campaigns).
// Singletons (Site Settings, Tuition & Fees) open straight into their editor.
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

// Shared groups — used by BOTH workspaces (Everyday edits + Everything), so
// each is built once here and never drifts between the two.

// Money & payments — every dollar amount and PayPal button code in one place:
// the fee schedule, per-class tuition, and fundraising campaigns.
function moneyGroup(S: StructureBuilder) {
  return S.listItem()
    .title('Money & payments')
    .id('money')
    .icon(emoji('💳'))
    .child(
      S.list()
        .title('Money & payments')
        .items([
          singleton(S, 'feeSchedule', 'Tuition & Fees', emoji('💳')),
          S.documentTypeListItem('class')
            .id('class-tuition')
            .title('Class tuition (open a class)')
            .icon(emoji('🎒')),
          S.documentTypeListItem('campaign').title('Fundraising campaigns').icon(emoji('💛')),
        ]),
    );
}

// Pages — the page builder (every public page as a stack of sections), plus
// the simple long-form legal pages.
function pagesGroup(S: StructureBuilder) {
  return S.listItem()
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
    );
}

// Form submissions — an inbox grouped BY FORM, not one flat pile. The folders
// are built live from the `topic` values that actually exist in the data (the
// board names topics freely on each form section), so a brand-new form shows
// up here automatically. "Needs a reply" (not yet marked Handled) sits on top.
function submissionsGroup(S: StructureBuilder, context: Parameters<StructureResolver>[1]) {
  const apiVersion = '2025-01-01';
  return S.listItem()
    .title('Form submissions')
    .id('submissions')
    .icon(emoji('📨'))
    .child(async () => {
      const client = context.getClient({ apiVersion });
      const topics = await client.fetch<(string | null)[]>(
        'array::unique(*[_type == "submission"].topic)',
      );
      const known = topics.filter((t): t is string => typeof t === 'string' && t.length > 0);
      known.sort((a, b) => a.localeCompare(b));
      const topicList = (title: string, filter: string, params?: Record<string, string>) =>
        S.documentList()
          .id(`submissions-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
          .title(title)
          .schemaType('submission')
          .filter(`_type == "submission" && ${filter}`)
          .params(params ?? {})
          .apiVersion(apiVersion)
          .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]);
      return S.list()
        .id('submissions-by-form')
        .title('Form submissions')
        .items([
          S.listItem()
            .id('submissions-unhandled')
            .title('Needs a reply')
            .icon(emoji('🔴'))
            .child(topicList('Needs a reply', 'handled != true')),
          S.divider(),
          ...known.map((topic) =>
            S.listItem()
              .id(`submissions-topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
              .title(topic)
              .icon(emoji('📮'))
              .child(topicList(topic, 'topic == $topic', { topic })),
          ),
          S.divider(),
          // documentTypeList (not a filtered list) so search/intent links for
          // submissions still have a pane that can open them.
          S.documentTypeListItem('submission').title('All messages').icon(emoji('🗂️')),
        ]);
    });
}

// Family Hub — the gated, families-only content.
function familyHubGroup(S: StructureBuilder, context: Parameters<StructureResolver>[1]) {
  return S.listItem()
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
          S.documentTypeListItem('celebration').title('Celebrations').icon(emoji('🎉')),
          orderableDocumentListDeskItem({
            type: 'hubDocument',
            S,
            context,
            title: 'Documents & Forms',
            icon: emoji('📄'),
          }),
          S.documentTypeListItem('teacherNote').title('Teacher welcome notes').icon(emoji('💌')),
          S.documentTypeListItem('directoryEntry').title('Family Directory').icon(emoji('👪')),
          S.documentTypeListItem('signupSheet')
            .title('Sign-ups & RSVPs (create sheets)')
            .icon(emoji('📝')),
          S.documentTypeListItem('signupEntry')
            .title('Sign-up responses (inbox)')
            .icon(emoji('🙋')),
          orderableDocumentListDeskItem({
            type: 'coopRole',
            S,
            context,
            title: 'Co-op Roles',
            icon: emoji('🤝'),
          }),
          S.documentTypeListItem('hoursLog').title('Co-op hours (ledger)').icon(emoji('⏱️')),
        ]),
    );
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
  'newsletterIssue',
  'event',
  'submission',
  'subscriber',
  'testimonialSubmission',
  'coopRole',
  'hoursLog',
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
  'signupSheet',
  'signupEntry',
  'redirect',
  'venue',
  'announcement',
  'celebration',
  // sanity-plugin-media stores its image tags as documents of this type;
  // they're managed inside the Media tool, so keep the raw list out of the
  // nav (a bare "Media Tag" item is just confusing).
  'media.tag',
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

      // ── Everyday edits ── the things volunteers log in to change most:
      // the alert banner, anything money, news, events, hub announcements.
      S.divider().title('Everyday edits'),

      singleton(S, 'closureAlert', 'Alert banner', emoji('🚨')),
      S.documentTypeListItem('announcement').title('Announcements').icon(emoji('📢')),
      moneyGroup(S),
      S.documentTypeListItem('post').title('News').icon(emoji('📰')),
      S.documentTypeListItem('newsletterIssue').title('Newsletter issues').icon(emoji('🗞️')),
      S.documentTypeListItem('event').title('Events').icon(emoji('📅')),
      pagesGroup(S),

      // ── School info ── the school facts that change a few times a year.
      S.divider().title('School info'),

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
      orderableDocumentListDeskItem({
        type: 'faqItem',
        S,
        context,
        title: 'FAQs',
        icon: emoji('❓'),
      }),
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

      // Community & content — the future-proofing collections that feed the
      // Programs / Board / Logo strip / Jobs / Downloads / Album page-builder
      // sections. Drag to reorder the list-style ones. (Fundraising campaigns
      // moved to Money & payments above.)
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
              S.documentTypeListItem('photoAlbum').title('Photo albums').icon(emoji('📸')),
              S.documentTypeListItem('venue').title('Locations / venues').icon(emoji('📍')),
            ]),
        ),

      // ── Family Hub ── the gated, families-only content.
      S.divider().title('Family Hub'),

      familyHubGroup(S, context),

      // ── Site setup ── set-up-once surfaces, out of the everyday eye-line.
      S.divider().title('Site setup'),

      singleton(S, 'siteSettings', 'Site Settings', emoji('⚙️')),
      singleton(S, 'navigation', 'Menus (header & footer)', emoji('🧭')),
      S.documentTypeListItem('redirect').title('Redirects (old links)').icon(emoji('↪️')),

      // ── Inboxes ── things the site sends TO the board (read, don't edit).
      S.divider().title('Inboxes'),

      submissionsGroup(S, context),
      S.documentTypeListItem('testimonialSubmission').title('Review submissions').icon(emoji('💬')),
      S.documentTypeListItem('subscriber').title('Newsletter subscribers').icon(emoji('✉️')),

      // Fallback: any type not explicitly placed above still shows up here.
      ...S.documentTypeListItems().filter((item) => !PLACED.has(item.getId() as string)),
    ]);

// =============================================================================
// The "Everyday edits" workspace structure — ONLY the publish-something-now
// tasks: the alert banner, money, news, events, pages, the Family Hub, and
// the inboxes. Deliberately SHORT so it reads clearly differently from
// "Everything" (which adds School info, Community & content, Site Settings,
// and Menus). Class documents stay reachable here through Money & payments →
// "Class tuition (open a class)" — that list opens the full class editor.
// NOTE: this trims the MENU only — it is comfort, not security (free-plan
// editors are Administrators either way, see docs/ROLES.md).
// =============================================================================
export const everydayStructure: StructureResolver = (S, context) =>
  S.list()
    .title('Everyday edits')
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

      S.divider().title('Everyday edits'),

      singleton(S, 'closureAlert', 'Alert banner', emoji('🚨')),
      S.documentTypeListItem('announcement').title('Announcements').icon(emoji('📢')),
      moneyGroup(S),
      S.documentTypeListItem('post').title('News').icon(emoji('📰')),
      S.documentTypeListItem('newsletterIssue').title('Newsletter issues').icon(emoji('🗞️')),
      S.documentTypeListItem('event').title('Events').icon(emoji('📅')),
      pagesGroup(S),

      S.divider().title('Family Hub'),

      familyHubGroup(S, context),

      S.divider().title('Inboxes'),

      submissionsGroup(S, context),
      S.documentTypeListItem('testimonialSubmission').title('Review submissions').icon(emoji('💬')),
      S.documentTypeListItem('subscriber').title('Newsletter subscribers').icon(emoji('✉️')),
    ]);
