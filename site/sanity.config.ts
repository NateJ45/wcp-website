import type { ComponentType } from 'react';
import { defineConfig, type PluginOptions, type Tool, type WorkspaceOptions } from 'sanity';
import {
  structureTool,
  type DefaultDocumentNodeResolver,
  type StructureResolver,
} from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { media } from 'sanity-plugin-media';
import { linkChecker } from 'sanity-plugin-link-checker';
import DocumentsPane from 'sanity-plugin-documents-pane';
import { SeoPreviewPane } from './src/sanity/components/SeoPreviewPane';
import {
  StudioLayout,
  WcpWorkspaceIcon,
  WcpHubWorkspaceIcon,
} from './src/sanity/components/StudioLayout';
import { ExportTool } from './src/sanity/components/ExportTool';
import { CleanupTool } from './src/sanity/components/CleanupTool';
import { HealthTool } from './src/sanity/components/HealthTool';
import { SetupWizard } from './src/sanity/components/SetupWizard';
import { StatsTool } from './src/sanity/components/StatsTool';
import { makePreviewNavigator } from './src/sanity/components/PreviewNavigator';
import { ApproveTestimonialAction } from './src/sanity/actions/approveTestimonial';
import { CreateClassPageAction } from './src/sanity/actions/createClassPage';
import { CreateClassHubPageAction } from './src/sanity/actions/createClassHubPage';
import { ArchiveAction, RestoreAction, DeleteForeverAction } from './src/sanity/actions/archive';
import { withSlugRedirect, SLUG_REDIRECT_TYPES } from './src/sanity/actions/slugRedirect';
import { shareDraftLinkAction } from './src/sanity/components/shareDraftLink';
import { SaveSectionPresetAction } from './src/sanity/actions/saveSectionPreset';
import { CheckPageAction } from './src/sanity/actions/checkPage';
import { UndoAction, RedoAction, undoRedoShortcuts } from './src/sanity/components/UndoRedo';
import { PAGE_BUILDER_TYPES } from './src/sanity/pageBuilderConfig';
import { schemaTypes, SINGLETON_TYPES, ARCHIVABLE_TYPES } from './src/sanity/schemaTypes';
import { ANNOUNCEMENT_TEMPLATES } from './src/sanity/announcementTemplates';
import { PAGE_TEMPLATES } from './src/sanity/pageTemplates';
import { HUB_TEMPLATES } from './src/sanity/hubTemplates';
import { resolveBadges } from './src/sanity/badges';
import { publicStructure, hubStructure } from './src/sanity/structure';
import { resolve } from './src/sanity/resolve';
import { wcpStudioTheme, wcpHubStudioTheme } from './src/sanity/theme';
import { projectId, dataset } from './src/sanity/env';

// =============================================================================
// Sanity Studio configuration — TWO workspaces over the SAME dataset
// =============================================================================
// Powers the Studio embedded at /studio by @sanity/astro — the ONE canonical
// Studio. We intentionally do NOT run a separate hosted <host>.sanity.studio
// (it drifts out of date; see sanity.cli.ts and docs/SANITY.md). Board members
// log in with their own Sanity accounts; the family gate is separate.
//
// Workspaces (the integration derives the URLs from the names; do not set
// basePath here — @sanity/astro overrides it). Because the site is a static
// build, the embedded Studio uses HASH routing, so the deployed URLs are:
//  - "Public website" → /studio/#/public      everything the world sees
//  - "Family Hub"     → /studio/#/family-hub  the gated families-only content
// The split is by AUDIENCE (since 2026-08; before that: "Everyday edits" vs
// "Everything", split by frequency — old bookmarks to those hashes land on
// the workspace picker, not an error). (Under `npx sanity dev` it's browser
// routing at /studio/studio/<name> — dev-only quirk from sanity.cli's own
// /studio base.) /studio itself lands on the FIRST workspace (Public
// website); the switcher in the top-left swaps between them. Both edit the
// same content — the trim is comfort, not permission (see docs/ROLES.md).
// Shared surfaces (Alert banner, Money & payments, Welcome, Help & Guide,
// Trash) appear in BOTH menus on purpose — see src/sanity/structure.ts.
//
// - theme: brand-matched navy/orange chrome + Quicksand via --font-family-base
//   (see src/sanity/theme.ts); the font files load in StudioLayout
//   (studio.components.layout), which also registers Captain Comic.
// - icon: the sun+cloud emblem (navbar + workspace switcher).
// - structure: the volunteer-friendly left nav (see src/sanity/structure.ts).
// - presentationTool: click-to-edit live preview against the Studio-only
//   /preview/* routes (never the real public pages — see src/sanity/resolve.ts
//   and src/pages/preview/). previewMode only sets `enable`: `disable` is a
//   documented no-op in this Sanity version ("not yet implemented"), so
//   exiting preview is a plain link to /api/draft-mode/disable instead
//   (see src/layouts/PreviewLayout.astro).
// - document.actions / newDocumentOptions: enforce singletons — one Site
//   Settings, one Tuition & Fees, with no duplicate/delete so nobody can create
//   a confusing second copy.
// - scheduledDrafts.enabled: false — per-document scheduled publishing is a
//   Growth-plan feature. We keep it OFF on purpose: it was briefly on during the
//   trial, but a "Schedule" button that disappears when the trial ends would
//   leave the board confused, so publishing is always immediate. (Same story
//   for AI Assist, deliberately not added. COMMENTS turned out to be core and
//   free — they work today and the volunteer guide teaches them, 2026-08-31;
//   Tasks are not present in this Studio version and stay un-taught.)
// - releases.enabled: false — the "Content Releases" bundle tool is also a paid
//   feature and more than the board needs, so we keep it off too.
// =============================================================================

// Extra document tabs, added by type:
//  - page / post / legal: a read-only SEO + social-share preview.
//  - shared docs: a "Used on" panel listing the pages/sections that reference
//    this one (answers "is it safe to change/delete?"). Kept on every type that
//    is genuinely referenced by others — staff (class.teacher, post.author) and
//    photoAlbum (album/instagram sections) are the real ones; page is included
//    because menus/buttons/CTAs point at pages (as reference OR path string),
//    and campaign because a section pulls it. All free — no plan gating.
const USED_ON_TYPES = [
  'page',
  'staff',
  'photoAlbum',
  'campaign',
  'class',
  'testimonial',
  'faqItem',
];

// The types that get "Undo last change" and "Redo" (PORTS.md card 27). Both
// page types, on BOTH workspaces: a public `page` and a Family Hub `hubPage`
// are the two documents a volunteer builds by dragging sections around, so they
// are where a mis-drag costs the most. This is deliberately NOT
// PAGE_BUILDER_TYPES, which lists only the hosts of the public `sections`
// array; hubPage carries its own builder array.
const UNDO_REDO_TYPES = new Set<string>(['page', 'hubPage']);

const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  if (['page', 'post', 'newsletterIssue'].includes(schemaType)) {
    return S.document().views([
      S.view.form(),
      S.view
        .component(SeoPreviewPane)
        .title('SEO preview')
        .icon(() => '🔎'),
      ...(USED_ON_TYPES.includes(schemaType) ? [usedOnView(S)] : []),
    ]);
  }
  if (USED_ON_TYPES.includes(schemaType)) {
    return S.document().views([S.view.form(), usedOnView(S)]);
  }
  // A sign-up sheet answers "who's coming?" on the sheet itself: a Responses
  // tab listing every signupEntry that references it, newest first. Before
  // this the sheet and its responses lived in two unrelated lists.
  if (schemaType === 'signupSheet') {
    return S.document().views([
      S.view.form(),
      S.view
        .component(DocumentsPane)
        .options({
          query: `*[_type == "signupEntry" && sheet._ref == $id] | order(_createdAt desc)`,
          params: { id: `_id` },
          options: { perspective: 'previewDrafts' },
        })
        .title('Responses')
        .icon(() => '🙋'),
    ]);
  }
  return S.document().views([S.view.form()]);
};

function usedOnView(S: Parameters<DefaultDocumentNodeResolver>[0]) {
  return S.view
    .component(DocumentsPane)
    .options({
      query: `*[references($id)]{ _id, _type, title, name }`,
      params: { id: `_id` },
      options: { perspective: 'previewDrafts' },
    })
    .title('Used on')
    .icon(() => '🔗');
}

// Everything both workspaces share; only name/title/structure/extras differ.
function workspace(opts: {
  name: string;
  title: string;
  subtitle: string;
  structure: StructureResolver;
  /** Workspace switcher icon; defaults to the plain sun+cloud emblem. */
  icon?: ComponentType;
  /** Where the Presentation tab opens (default: the public home preview).
      The hub workspace points it at the hub home preview instead. */
  previewInitial?: string;
  /** Which page list the Presentation navigator (the Squarespace-style side
      panel) shows: public `page` docs or hub `hubPage` docs. */
  navigatorKind?: 'public' | 'hub';
  /** Workspace chrome theme; defaults to the navy/blue brand theme. The hub
      workspace passes the WARM twin so the two doors look different at a
      glance (see src/sanity/theme.ts). */
  theme?: typeof wcpStudioTheme;
  extraPlugins?: PluginOptions[];
  /** Extra Studio tools (navbar entries), e.g. the CSV export tool. */
  extraTools?: Tool[];
}): WorkspaceOptions {
  return {
    name: opts.name,
    title: opts.title,
    subtitle: opts.subtitle,
    // basePath is overridden by @sanity/astro (URL = /studio/<name>), but the
    // WorkspaceOptions type requires it.
    basePath: `/studio/${opts.name}`,
    icon: opts.icon ?? WcpWorkspaceIcon,
    projectId,
    dataset,
    theme: opts.theme ?? wcpStudioTheme,
    releases: { enabled: false },
    // Sanity's own scheduled publishing is a paid (Growth) feature. We keep it
    // OFF so the board never builds a habit around a "Schedule" button that
    // would vanish when the trial ends. (Was briefly enabled during the trial.)
    // The free replacement is the "Publish automatically at" field on pages and
    // hub pages, published by a half-hourly GitHub Action — see
    // src/sanity/schemaTypes/_publishAt.ts and scripts/publish-due.mjs.
    scheduledDrafts: { enabled: false },
    studio: { components: { layout: StudioLayout } },
    // Append any extra tools (e.g. CSV export) after the built-in ones.
    tools: (prev) => [...prev, ...(opts.extraTools ?? [])],
    plugins: [
      structureTool({ structure: opts.structure, defaultDocumentNode }),
      presentationTool({
        resolve,
        previewUrl: {
          initial: opts.previewInitial ?? '/preview',
          previewMode: { enable: '/api/draft-mode/enable' },
        },
        // The Squarespace-style page list beside the preview: click a page,
        // the preview jumps there and the edit panel follows.
        components: {
          unstable_navigator: {
            component: makePreviewNavigator(opts.navigatorKind ?? 'public'),
            minWidth: 160,
            maxWidth: 280,
          },
        },
      }),
      // Media library — a WordPress/Squarespace-style asset manager. Adds a
      // "Media" tool to the Studio nav (grid browse, search, tags, edit alt/
      // title, see where each image is used) and a browse option in every image
      // picker. Self-contained; no external provisioning.
      media(),
      // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (Cmd on a Mac) for everything that is
      // not typing: sections added, dragged or removed, photos cleared,
      // backgrounds changed (PORTS.md card 27). The buttons are the two
      // document actions in the resolver below; this plugin adds only the
      // keyboard layer, and it stays out of text boxes so their own undo keeps
      // working. It contributes a SECOND studio.components.layout. Sanity
      // composes layout components middleware-style, so it wraps around
      // StudioLayout above rather than replacing it - both call renderDefault.
      // See src/sanity/components/UndoRedo.tsx.
      undoRedoShortcuts(),
      ...(opts.extraPlugins ?? []),
    ],
    schema: {
      types: schemaTypes,
      // Pre-filled "＋ New" starting points: announcement bars/popups and the
      // page layout templates (the blank "Page" option stays available too).
      templates: (prev) => [
        ...prev,
        ...ANNOUNCEMENT_TEMPLATES,
        ...PAGE_TEMPLATES,
        ...HUB_TEMPLATES,
      ],
    },
    document: {
      // Action wiring, in priority order:
      //  - trashedItem: only Restore + Delete forever (no publish/duplicate/native
      //    delete) — it's a receipt, not editable content.
      //  - testimonialSubmission: adds the one-click "Approve into Testimonials".
      //  - singletons: keep only editing actions (no unpublish/delete/duplicate).
      //  - archivable content: swap the destructive Delete for Archive (soft
      //    delete into "Recently deleted"); everything else (publish, duplicate…)
      //    stays.
      //
      // Before any of that, types with a public web address (page, post) get
      // their stock Publish WRAPPED so renaming a slug files a redirect for the
      // old address automatically — see src/sanity/actions/slugRedirect.tsx.
      // The wrapper is memoized per wrapped component, so this stays a stable
      // component identity across renders.
      //
      // "Copy share link" is appended LAST, to every type except the trash
      // receipt. The action renders itself away for any document with no public
      // page of its own (src/sanity/urls.ts decides), so appending it broadly
      // costs nothing and keeps the wiring one line. Family Hub pages are one
      // of the types that get nothing: a share link carries the Studio preview
      // cookie, which is all the gated hub preview asks for, so a hub link
      // would hand family content to whoever holds it. The reasoning lives in
      // src/sanity/urls.ts — read it before adding hubPage there.
      // Status chips on lists/headers — expired spotlights, past events,
      // self-publishing drafts, pinned updates (src/sanity/badges.ts).
      badges: resolveBadges,
      actions: (prev, { schemaType }) => {
        const base = SLUG_REDIRECT_TYPES.has(schemaType)
          ? prev.map((a) => (a.action === 'publish' ? withSlugRedirect(a) : a))
          : prev;

        // Page-builder helpers: keep one of this page's sections for reuse, and
        // the gentle pre-publish read-through. Both open a dialog and neither
        // blocks anything (src/sanity/actions/saveSectionPreset.tsx, checkPage.tsx).
        // The type list lives in src/sanity/pageBuilderConfig.ts, beside the
        // builder-array names those two actions read.
        const pageHelpers = PAGE_BUILDER_TYPES.has(schemaType)
          ? [SaveSectionPresetAction, CheckPageAction]
          : [];

        // Undo / Redo (PORTS.md card 27), on the two draft-editable page types.
        // A page is where a mis-drag or a wrong background actually costs
        // something, and where "which change do you mean?" has an obvious
        // answer. They come FIRST among the added actions, so the step back
        // sits at the top of the menu where an editor looks for it. The
        // keyboard shortcut is registered separately, by the plugin above.
        const undoRedo = UNDO_REDO_TYPES.has(schemaType) ? [UndoAction, RedoAction] : [];

        if (schemaType === 'trashedItem') return [RestoreAction, DeleteForeverAction];
        if (schemaType === 'testimonialSubmission')
          return [ApproveTestimonialAction, ...base, shareDraftLinkAction];
        if (SINGLETON_TYPES.has(schemaType)) {
          return [
            ...base.filter(
              ({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action || ''),
            ),
            shareDraftLinkAction,
          ];
        }
        // One-click page scaffolding for a class (2026-08-29): every
        // mechanical step of "give this class its own page" on a button, so
        // the four-step add-a-class checklist loses its fiddliest step. Two
        // buttons, one per side of the site — the public detail page, and the
        // gated hub handbook. The hub CLASS PAGE itself needs no button: it
        // exists as soon as the class is published.
        const classHelpers =
          schemaType === 'class' ? [CreateClassPageAction, CreateClassHubPageAction] : [];

        if (ARCHIVABLE_TYPES.has(schemaType)) {
          return [
            ...base.filter(({ action }) => action !== 'delete'),
            ...undoRedo,
            ...pageHelpers,
            ...classHelpers,
            ArchiveAction,
            shareDraftLinkAction,
          ];
        }
        return [...base, ...undoRedo, ...pageHelpers, shareDraftLinkAction];
      },
      // Keep singletons AND trashedItem out of the global "create new" menu
      // (you never hand-author a trash receipt, and legalPage is retired —
      // see docs/FIELD_AUDIT.md).
      newDocumentOptions: (prev, { creationContext }) =>
        creationContext.type === 'global'
          ? prev.filter(
              (option) =>
                !SINGLETON_TYPES.has(option.templateId) &&
                !['trashedItem', 'legalPage', 'venue'].includes(option.templateId),
            )
          : prev,
    },
  };
}

// The custom Studio tools, placed per workspace by where their data lives.
// Export — download subscribers / submissions / directory as a CSV, so the
// board can move email providers or hand off without the developer. Its lists
// span both audiences (subscribers are public, the directory is hub), so BOTH
// workspaces get it.
const exportTool: Tool = {
  name: 'export',
  title: 'Export',
  component: ExportTool,
  icon: () => '📤',
};
// Cleanup — bulk-delete old inbox records (handled messages, past RSVPs),
// with a count preview + typed confirmation. Free-plan bulk delete.
const cleanupTool: Tool = {
  name: 'cleanup',
  title: 'Clean up',
  component: CleanupTool,
  icon: () => '🧹',
};
// Checkup — read-only "what needs attention?" report (banner left on, old
// messages, stale pages, class gaps). Cross-surface, so both workspaces.
const checkupTool: Tool = {
  name: 'checkup',
  title: 'Checkup',
  component: HealthTool,
  icon: () => '🩺',
};
// Start-of-year — a read-only guided checklist for the annual rollover (year
// label, dates, tuition, hours goal, events, content refresh), each card
// jumping straight to the thing to update. Cross-surface, so both workspaces.
const setupTool: Tool = {
  name: 'setup',
  title: 'Start of year',
  component: SetupWizard,
  icon: () => '🍂',
};
// Site stats — the traffic panel Squarespace and Wix put in their editors, so
// board members go looking for it here. Read-only: it calls the site's own
// /api/stats (Cloudflare Workers analytics for this Worker) and draws 28 days
// of daily request counts. PUBLIC workspace only — it measures the public
// website, and the Family Hub's own traffic is not a thing anyone asks about.
// The number is REQUESTS SERVED, not page views; see the component's header
// before touching any label.
const statsTool: Tool = {
  name: 'stats',
  title: 'Site stats',
  component: StatsTool,
  icon: () => '📈',
};

export default defineConfig([
  // First = where /studio lands.
  workspace({
    name: 'public',
    title: 'Public website',
    subtitle: 'What everyone sees',
    structure: publicStructure,
    extraPlugins: [
      // Link Checker — a Studio tool that scans content for broken external
      // links and dangling document references, with one click to the
      // offending doc. Complements the CI link check (which only sees internal
      // links in the built site). Public side only: most external links live
      // in public content, and the hub has its own weekly Link health report.
      linkChecker(),
    ],
    extraTools: [exportTool, checkupTool, setupTool, statsTool],
  }),
  workspace({
    name: 'family-hub',
    title: 'Family Hub',
    subtitle: 'Behind the family password',
    structure: hubStructure,
    icon: WcpHubWorkspaceIcon,
    theme: wcpHubStudioTheme,
    previewInitial: '/preview/family-hub/home',
    navigatorKind: 'hub',
    // Clean up sits on the hub side: its biggest bulk-deletes are past RSVPs
    // and old sign-up responses (it also empties handled public messages —
    // one tool, one home).
    extraTools: [exportTool, cleanupTool, checkupTool, setupTool],
  }),
]);
