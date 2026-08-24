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
import { ApproveTestimonialAction } from './src/sanity/actions/approveTestimonial';
import { ArchiveAction, RestoreAction, DeleteForeverAction } from './src/sanity/actions/archive';
import { schemaTypes, SINGLETON_TYPES, ARCHIVABLE_TYPES } from './src/sanity/schemaTypes';
import { ANNOUNCEMENT_TEMPLATES } from './src/sanity/announcementTemplates';
import { publicStructure, hubStructure } from './src/sanity/structure';
import { resolve } from './src/sanity/resolve';
import { wcpStudioTheme } from './src/sanity/theme';
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
//   leave the board confused, so publishing is always immediate. (Same story for
//   Comments/Tasks and AI Assist, which we deliberately have NOT added.)
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
    theme: wcpStudioTheme,
    releases: { enabled: false },
    // Scheduled publishing is a paid (Growth) feature. We keep it OFF so the
    // board never builds a habit around a "Schedule" button that would vanish
    // when the trial ends — publishing is immediate, and a future post can just
    // be published on the day. (Was briefly enabled during the trial.)
    scheduledDrafts: { enabled: false },
    studio: { components: { layout: StudioLayout } },
    // Append any extra tools (e.g. CSV export) after the built-in ones.
    tools: (prev) => [...prev, ...(opts.extraTools ?? [])],
    plugins: [
      structureTool({ structure: opts.structure, defaultDocumentNode }),
      presentationTool({
        resolve,
        previewUrl: {
          initial: '/preview',
          previewMode: { enable: '/api/draft-mode/enable' },
        },
      }),
      // Media library — a WordPress/Squarespace-style asset manager. Adds a
      // "Media" tool to the Studio nav (grid browse, search, tags, edit alt/
      // title, see where each image is used) and a browse option in every image
      // picker. Self-contained; no external provisioning.
      media(),
      ...(opts.extraPlugins ?? []),
    ],
    schema: { types: schemaTypes, templates: (prev) => [...prev, ...ANNOUNCEMENT_TEMPLATES] },
    document: {
      // Action wiring, in priority order:
      //  - trashedItem: only Restore + Delete forever (no publish/duplicate/native
      //    delete) — it's a receipt, not editable content.
      //  - testimonialSubmission: adds the one-click "Approve into Testimonials".
      //  - singletons: keep only editing actions (no unpublish/delete/duplicate).
      //  - archivable content: swap the destructive Delete for Archive (soft
      //    delete into "Recently deleted"); everything else (publish, duplicate…)
      //    stays.
      actions: (prev, { schemaType }) => {
        if (schemaType === 'trashedItem') return [RestoreAction, DeleteForeverAction];
        if (schemaType === 'testimonialSubmission') return [ApproveTestimonialAction, ...prev];
        if (SINGLETON_TYPES.has(schemaType)) {
          return prev.filter(
            ({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action || ''),
          );
        }
        if (ARCHIVABLE_TYPES.has(schemaType)) {
          return [...prev.filter(({ action }) => action !== 'delete'), ArchiveAction];
        }
        return prev;
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
    extraTools: [exportTool, checkupTool, setupTool],
  }),
  workspace({
    name: 'family-hub',
    title: 'Family Hub',
    subtitle: 'Behind the family password',
    structure: hubStructure,
    icon: WcpHubWorkspaceIcon,
    // Clean up sits on the hub side: its biggest bulk-deletes are past RSVPs
    // and old sign-up responses (it also empties handled public messages —
    // one tool, one home).
    extraTools: [exportTool, cleanupTool, checkupTool, setupTool],
  }),
]);
