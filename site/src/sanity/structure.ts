import type { StructureResolver, StructureBuilder } from 'sanity/structure';
import type { ComponentType } from 'react';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { guides, GUIDE_CATEGORY_ORDER } from './guides/content';
import { makeGuideView } from './components/GuideView';
import { WelcomePane } from './components/WelcomePane';

// =============================================================================
// Studio structure — the left-hand navigation a volunteer sees
// =============================================================================
// TWO workspaces, split by AUDIENCE (since 2026-08; before that the split was
// by task frequency — "Everyday edits" vs "Everything"):
//  - publicStructure — the PUBLIC website: pages, news, events, money, school
//    info, site setup, and the inboxes the public forms fill.
//  - hubStructure — the gated FAMILY HUB: updates, sign-ups, the directory,
//    co-op admin, hub pages, printables, and the hub inboxes.
// Each menu keeps frequency bands inside it: everyday jobs on top, setup at
// the bottom. Three things appear in BOTH menus on purpose:
//  - Alert banner — a snow day must never hide in the "other" workspace.
//  - Money & payments — ONE money home for the Treasurer. Tuition is public;
//    the budget and campaigns also render on hub pages. Nobody should have to
//    learn an audience split for money.
//  - Welcome, Help & Guide, and Trash — the shared chrome.
// Both workspaces edit the SAME dataset — one document, two doors. The split
// is menu-only comfort, not permission (see docs/ROLES.md).
//
// Icons are plain emoji (friendly, and matches the schema icons) — Astro 7's
// bundler doesn't tree-shake the @sanity/icons barrel cleanly.
// =============================================================================

const emoji =
  (glyph: string): ComponentType =>
  () =>
    glyph;

// =============================================================================
// Year-scoped lists (2026-08-31) — the decade-proofing for accumulating types
// =============================================================================
// Updates, events, celebrations, sign-up sheets, news, newsletters and the
// hours ledger grow forever. A flat list means year-three volunteers scroll
// past a hundred dead rows to find this week's — so each of those types opens
// as "This school year" (the default view) plus one pane per past year, with
// an Everything list at the bottom for searching across time. Nothing moves
// or archives; this is presentation only. School years run Aug 1 – Jul 31 and
// are named by their fall ("2026–27").
const FIRST_CONTENT_YEAR = 2025; // the site's first posts (Sep 2025)

const currentFallYear = (): number => {
  const d = new Date();
  return d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; // Aug+ = this fall
};
const yearLabel = (y: number): string => `${y}–${String((y + 1) % 100).padStart(2, '0')}`;

function yearScopedList(
  S: StructureBuilder,
  opts: {
    type: string;
    title: string;
    icon: ComponentType;
    /** The doc's own date field; undated docs fall back to _createdAt. */
    dateField: string;
    direction?: 'asc' | 'desc';
  },
) {
  const { type, title, icon, dateField, direction = 'desc' } = opts;
  const fall = currentFallYear();
  const filter = `_type == $type && coalesce(${dateField}, _createdAt) >= $from && coalesce(${dateField}, _createdAt) < $to`;

  const yearPane = (y: number, paneTitle: string) =>
    S.listItem()
      .id(`year-${y}`)
      .title(paneTitle)
      .icon(icon)
      .child(
        S.documentList()
          .id(`year-${y}`)
          .title(paneTitle)
          .schemaType(type)
          .filter(filter)
          .params({ type, from: `${y}-08-01`, to: `${y + 1}-08-01` })
          .defaultOrdering([{ field: dateField, direction }]),
      );

  const past: ReturnType<typeof yearPane>[] = [];
  for (let y = fall - 1; y >= FIRST_CONTENT_YEAR; y--) past.push(yearPane(y, yearLabel(y)));

  // .id(type) keeps the pane's address identical to the old flat list, so
  // every guide link and bookmark still lands here.
  return S.listItem()
    .id(type)
    .title(title)
    .icon(icon)
    .child(
      S.list()
        .id(type)
        .title(title)
        .items([
          yearPane(fall, `This school year (${yearLabel(fall)})`),
          ...(past.length > 0 ? [S.divider().title('Past years'), ...past] : []),
          S.divider(),
          S.listItem()
            .id('everything')
            .title('Everything (all years)')
            .icon(emoji('🗂️'))
            .child(S.documentTypeList(type).title(title)),
        ]),
    );
}

// The "Help & Guide" center — a folder of read-only walkthrough panes, built
// from the guides data. Volunteers cannot edit or delete it. Grouped under
// titled dividers by guide.category (~40 guides in one flat run was
// overwhelming to scan). Each workspace lists only ITS guides (per-guide `ws`
// tag; untagged = both sides), in per-workspace group order
// (GUIDE_CATEGORY_ORDER): each side leads with its own work, and a category
// with no guides on a side does not render there. The GuideCategory union
// type stops a new guide from missing its group.
function howThisWorks(S: StructureBuilder, kind: 'public' | 'hub') {
  const guideItem = (g: (typeof guides)[number]) =>
    S.listItem()
      .id(`guide-${g.slug}`)
      .title(g.title)
      .icon(emoji(g.icon))
      .child(
        // Cast: our pane ignores props, but S.component wants the pane type.
        S.component(makeGuideView(g.slug) as never)
          .id(`guide-view-${g.slug}`)
          .title(g.title),
      );
  return S.listItem()
    .id('help-and-guide')
    .title('Help & Guide')
    .icon(emoji('❔'))
    .child(
      S.list()
        .id('help-and-guide-list')
        .title('Help & Guide')
        .items(
          GUIDE_CATEGORY_ORDER[kind].flatMap((category) => {
            const mine = guides.filter((g) => g.category === category && (!g.ws || g.ws === kind));
            return mine.length === 0 ? [] : [S.divider().title(category), ...mine.map(guideItem)];
          }),
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

// The Welcome landing pane — shared by both workspaces.
function welcomeItem(S: StructureBuilder) {
  return S.listItem()
    .id('welcome')
    .title('Welcome')
    .icon(emoji('🏠'))
    .child(
      S.component(WelcomePane as never)
        .id('welcome-pane')
        .title('Welcome'),
    );
}

// Shared groups — used by BOTH workspaces, so each is built once here and
// never drifts between the two.

// Money & payments — every dollar amount and PayPal button in one place:
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
          // The Treasurer's own approved budget. It sits with the other money
          // so she never has to hunt for it, and it is the page the Board reads
          // at the annual meeting.
          singleton(S, 'operatingBudget', 'Operating budget (yearly)', emoji('📊')),
          S.documentTypeListItem('class')
            .id('class-tuition')
            .title('Class tuition (open a class)')
            .icon(emoji('🎒')),
          S.documentTypeListItem('campaign').title('Fundraising campaigns').icon(emoji('💛')),
        ]),
    );
}

// Pages — the page builder (every public page as a stack of sections). The
// policy pages are ordinary builder pages too, so this is one flat list.
// (`legalPage` was retired 2026-08-23 — see docs/FIELD_AUDIT.md; the id
// 'pages' is load-bearing: the Welcome pane deep-links to it.)
function pagesGroup(S: StructureBuilder) {
  return S.documentTypeListItem('page')
    .id('pages')
    .title('Pages (section builder)')
    .icon(emoji('🧱'));
}

// Saved sections — reusable single sections captured off a page ("Save a
// section as preset…" in a page's publish menu). They are a TOOL, not content:
// nothing here renders on the website until someone adds one to a page from the
// "Saved sections" group beside the live preview. Ordered by name, because the
// name is the only way you find one again.
function savedSectionsGroup(S: StructureBuilder) {
  return S.listItem()
    .id('section-presets')
    .title('Saved sections')
    .icon(emoji('🧩'))
    .child(
      S.documentTypeList('sectionPreset')
        .id('section-presets-list')
        .title('Saved sections')
        .defaultOrdering([{ field: 'title', direction: 'asc' }]),
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

// Everything placed explicitly across the two workspace menus — kept out of
// the fallback list. A NEW schema type not added to either menu still shows
// up at the bottom of the Public website workspace, so nothing can vanish.
const PLACED = new Set([
  'siteSettings',
  'siteMicrocopy',
  'navigation',
  'closureAlert',
  'feeSchedule',
  'operatingBudget',
  'class',
  'staff',
  'faqItem',
  'testimonial',
  'schoolYearEvent',
  'legalPage',
  'page',
  'sectionPreset',
  'post',
  'newsletterIssue',
  'event',
  'submission',
  'subscriber',
  'testimonialSubmission',
  'photoSubmission',
  'coopRole',
  'roleHolder',
  'coopGuidance',
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
  'hubNavMenu',
  'hubTour',
  'hubHints',
  'linkHealth',
  'hubDelights',
  'hubStore',
  'hubSettings',
  'curriculumGuide',
  'supplyList',
  'presidentNote',
  'signupSheet',
  'signupEntry',
  'redirect',
  'venue',
  'announcement',
  'celebration',
  'trashedItem',
  // sanity-plugin-media stores its image tags as documents of this type;
  // they're managed inside the Media tool, so keep the raw list out of the
  // nav (a bare "Media Tag" item is just confusing).
  'media.tag',
]);

// =============================================================================
// The "Public website" workspace — everything the world sees. This is where
// /studio lands. Bands run from the everyday jobs (alert, money, news, events,
// pages) down through School info to Site setup and the public inboxes.
// =============================================================================
export const publicStructure: StructureResolver = (S, context) =>
  S.list()
    .title('Public website')
    .items([
      welcomeItem(S),

      howThisWorks(S, 'public'),

      // ── Everyday edits ── the things volunteers log in to change most:
      // the alert banner, anything money, news, events, pages.
      S.divider().title('Everyday edits'),

      singleton(S, 'closureAlert', 'Alert banner', emoji('🚨')),
      S.documentTypeListItem('announcement').title('Announcements').icon(emoji('📢')),
      moneyGroup(S),
      yearScopedList(S, {
        type: 'post',
        title: 'News',
        icon: emoji('📰'),
        dateField: 'publishedAt',
      }),
      yearScopedList(S, {
        type: 'newsletterIssue',
        title: 'Newsletter issues',
        icon: emoji('🗞️'),
        dateField: 'publishedAt',
      }),
      yearScopedList(S, {
        type: 'event',
        title: 'Events',
        icon: emoji('📅'),
        dateField: 'startDate',
      }),
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
      orderableDocumentListDeskItem({
        type: 'staff',
        S,
        context,
        title: 'Staff',
        icon: emoji('👩‍🏫'),
      }),
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
      // live in Money & payments above.)
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
              // ('venue' left the menu 2026-08-23 with event.venue hidden —
              // zero uses; the type stays registered. docs/FIELD_AUDIT.md.)
            ]),
        ),

      // ── Site setup ── set-up-once surfaces, out of the everyday eye-line.
      S.divider().title('Site setup'),

      // Saved section presets live with setup: reached rarely, kept forever.
      savedSectionsGroup(S),

      singleton(S, 'siteSettings', 'Site Settings', emoji('⚙️')),
      singleton(S, 'navigation', 'Menus (header & footer)', emoji('🧭')),
      // The thank-you page, "page not found", and footer sign-off wording.
      singleton(S, 'siteMicrocopy', 'Small bits of wording', emoji('✍️')),
      S.documentTypeListItem('redirect').title('Redirects (old links)').icon(emoji('↪️')),

      // ── Inboxes ── what the PUBLIC site sends the board (read, don't edit).
      // The hub-side inboxes (sign-up responses, family photos) live in the
      // Family Hub workspace.
      S.divider().title('Inboxes'),

      submissionsGroup(S, context),
      S.documentTypeListItem('testimonialSubmission').title('Review submissions').icon(emoji('💬')),
      S.documentTypeListItem('subscriber').title('Newsletter subscribers').icon(emoji('✉️')),

      // ── Recently deleted ── soft-deleted content; restore or empty for good.
      S.divider().title('Trash'),
      S.documentTypeListItem('trashedItem').title('Recently deleted').icon(emoji('🗑️')),

      // Fallback: any type not explicitly placed in EITHER workspace menu
      // still shows up here.
      ...S.documentTypeListItems().filter((item) => !PLACED.has(item.getId() as string)),
    ]);

// =============================================================================
// The "Family Hub" workspace — the gated, families-only content. What was one
// flat 20-item folder is four small bands: everyday jobs, families & co-op,
// the hub's own pages and look, and the printables. The hub inboxes and Trash
// close the menu.
// =============================================================================
export const hubStructure: StructureResolver = (S, context) =>
  S.list()
    .title('Family Hub')
    .items([
      welcomeItem(S),

      howThisWorks(S, 'hub'),

      // ── Everyday edits ── the hub jobs a volunteer does most: post an
      // update, celebrate a family, open a sign-up, share a document.
      S.divider().title('Everyday edits'),

      // Sequenced by real-world cadence: the alert stays first (a snow day
      // must be findable in a panic), then the weekly rhythm (updates,
      // sign-ups, documents), then money, then the occasional pieces.
      singleton(S, 'closureAlert', 'Alert banner', emoji('🚨')),
      yearScopedList(S, {
        type: 'update',
        title: 'Updates',
        icon: emoji('📣'),
        dateField: 'publishedAt',
      }),
      yearScopedList(S, {
        type: 'signupSheet',
        title: 'Sign-ups & RSVPs (create sheets)',
        icon: emoji('📝'),
        dateField: 'eventDate',
        direction: 'asc',
      }),
      orderableDocumentListDeskItem({
        type: 'hubDocument',
        S,
        context,
        title: 'Documents & Forms',
        icon: emoji('📄'),
      }),
      moneyGroup(S),
      yearScopedList(S, {
        type: 'celebration',
        title: 'Celebrations',
        icon: emoji('🎉'),
        dateField: 'date',
      }),
      // The collection sibling of the President's note: several pop-ups a
      // year, each greeting families once on any hub page. Drag to set which
      // one wins when more than one is on.
      orderableDocumentListDeskItem({
        type: 'hubSpotlight',
        S,
        context,
        title: 'Spotlight pop-ups',
        icon: emoji('🔦'),
      }),
      singleton(S, 'presidentNote', "President's note", emoji('💌')),

      // ── Families & co-op ── who the families are and how the co-op runs.
      S.divider().title('Families & co-op'),

      // Grouped by class, because that is how a class rep thinks ("my Twos
      // families"). The panes DERIVE from the live class documents — a new
      // class gets its pane with no code change — and a family whose children
      // span classes shows up under each of them. "All families" keeps the
      // full flat list. A directory child's class is stored as the class SLUG
      // (see directoryEntry's ClassPickInput).
      S.listItem()
        .id('directoryEntry')
        .title('Family Directory')
        .icon(emoji('👪'))
        .child(async () => {
          const client = context.getClient({ apiVersion: '2025-01-01' });
          // class.slug is Sanity's slug TYPE here (unlike page slugs, which
          // are plain strings) — project .current or the pane id renders
          // "[object Object]" and the whole structure errors.
          const classes = await client.fetch<{ slug?: string; name?: string }[]>(
            `*[_type == "class" && !(_id in path("drafts.**")) && defined(slug.current)] | order(name asc){ "slug": slug.current, name }`,
          );
          return S.list()
            .id('directoryEntry')
            .title('Family Directory')
            .items([
              S.listItem()
                .id('directory-all')
                .title('All families')
                .icon(emoji('👪'))
                .child(S.documentTypeList('directoryEntry').title('All families')),
              S.divider().title('By class'),
              ...classes.map((c) =>
                S.listItem()
                  .id(`directory-class-${c.slug}`)
                  .title(c.name ?? c.slug ?? '')
                  .icon(emoji('🎒'))
                  .child(
                    S.documentList()
                      .id(`directory-class-${c.slug}`)
                      .title(c.name ?? c.slug ?? '')
                      .schemaType('directoryEntry')
                      .filter('_type == "directoryEntry" && $slug in children[].class')
                      .params({ slug: c.slug }),
                  ),
              ),
            ]);
        }),
      S.documentTypeListItem('teacherNote').title('Teacher welcome notes').icon(emoji('💌')),
      // This list IS the org chart: each role says where it sits and who it
      // reports to, and the chart on the Co-op Jobs page draws itself from
      // that. Drag to reorder. It used to be a job-description list only, with
      // the chart's shape locked in code.
      orderableDocumentListDeskItem({
        type: 'coopRole',
        S,
        context,
        title: 'Co-op roles & org chart',
        icon: emoji('🤝'),
      }),
      // Sits directly under Co-op roles on purpose: that list is what each
      // job IS and where it sits, the guidance is the rules families live by,
      // and roleHolder is who HOLDS each job this year. The pairing is the
      // whole mental model, and roleHolder is the list that changes every
      // spring while the roles themselves rarely do.
      singleton(S, 'coopGuidance', 'How the co-op works', emoji('🧭')),
      S.documentTypeListItem('roleHolder')
        .title('Who’s who this year (update each fall)')
        .icon(emoji('🪪')),
      yearScopedList(S, {
        type: 'hoursLog',
        title: 'Co-op hours (ledger)',
        icon: emoji('⏱️'),
        dateField: 'date',
      }),

      // ── Hub pages & look ── the hub's own pages, menu, and app chrome.
      S.divider().title('Hub pages & look'),

      // "edit content OR add a page": the list is also where a board CREATES
      // a hub page (a doc with a slug and no hubKey, served by the gated
      // catch-all), so the label should not imply editing only.
      S.documentTypeListItem('hubPage')
        .title('Hub pages (edit content, or add a page)')
        .icon(emoji('🧱')),
      // The menu + app-chrome singletons, folded into ONE folder (2026-08-31)
      // so the rail stays scannable: five rows became one. Each pane keeps
      // its own id, so old guide links still resolve.
      S.listItem()
        .id('hub-look')
        .title('Hub look & feel')
        .icon(emoji('🎨'))
        .child(
          S.list()
            .id('hub-look')
            .title('Hub look & feel')
            .items([
              // The rail menu, right beside the pages it arranges (the public
              // header/footer equivalent lives in the Public website workspace
              // as "Menus").
              singleton(S, 'hubNavMenu', 'Family Hub menu (rail & phone bar)', emoji('🧭')),
              singleton(S, 'hubTour', 'First-visit tour', emoji('🎈')),
              singleton(S, 'hubHints', 'Feature hints', emoji('💡')),
              singleton(S, 'hubDelights', 'Little delights', emoji('🎉')),
              // The store card at the bottom of the hub home.
              singleton(S, 'hubStore', 'Merch store card', emoji('🛍️')),
            ]),
        ),

      // ── Printables ── the two PDF sources: edits here regenerate the
      // branded PDFs on the next deploy (the publish webhook fires one).
      S.divider().title('Printables (PDFs)'),

      S.documentTypeListItem('curriculumGuide')
        .title('Curriculum guides (PDF content)')
        .icon(emoji('📚')),
      singleton(S, 'supplyList', 'School supply list (PDF content)', emoji('🎒')),

      // ── Hub setup ── the hub's yearly data and Google connections
      // (handbook PDF, hours goal, family count, past totals, sheet/feed
      // codes, directory-map toggle).
      S.divider().title('Hub setup'),

      singleton(S, 'hubSettings', 'Hub settings (yearly & links)', emoji('🛠️')),

      // ── Inboxes ── what families send the board (read, don't edit).
      S.divider().title('Inboxes'),

      S.documentTypeListItem('signupEntry').title('Sign-up responses (inbox)').icon(emoji('🙋')),
      // The moderation queue leads: "Waiting for review" is the pane a board
      // member actually works, and in a flat list it sank under months of
      // approved history. Approved and Everything sit behind it.
      S.listItem()
        .id('photoSubmission')
        .title('Family photos (review)')
        .icon(emoji('📷'))
        .child(
          S.list()
            .id('photoSubmission')
            .title('Family photos')
            .items([
              S.listItem()
                .id('photos-pending')
                .title('Waiting for review')
                .icon(emoji('🕒'))
                .child(
                  S.documentList()
                    .id('photos-pending')
                    .title('Waiting for review')
                    .schemaType('photoSubmission')
                    .filter('_type == "photoSubmission" && approved != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .id('photos-approved')
                .title('Approved (on the photo wall)')
                .icon(emoji('✅'))
                .child(
                  S.documentList()
                    .id('photos-approved')
                    .title('Approved')
                    .schemaType('photoSubmission')
                    .filter('_type == "photoSubmission" && approved == true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.divider(),
              S.listItem()
                .id('photos-all')
                .title('Everything')
                .icon(emoji('🗂️'))
                .child(S.documentTypeList('photoSubmission').title('Family photos')),
            ]),
        ),
      // Written by the weekly link-health workflow; a report, not a form.
      singleton(S, 'linkHealth', 'Link health (weekly check)', emoji('🩺')),

      S.divider().title('Trash'),
      S.documentTypeListItem('trashedItem').title('Recently deleted').icon(emoji('🗑️')),
    ]);
