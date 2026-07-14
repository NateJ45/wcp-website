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
import { StudioLayout, WcpWorkspaceIcon } from './src/sanity/components/StudioLayout';
import { ExportTool } from './src/sanity/components/ExportTool';
import { CleanupTool } from './src/sanity/components/CleanupTool';
import { HealthTool } from './src/sanity/components/HealthTool';
import { SetupWizard } from './src/sanity/components/SetupWizard';
import { ApproveTestimonialAction } from './src/sanity/actions/approveTestimonial';
import { schemaTypes, SINGLETON_TYPES } from './src/sanity/schemaTypes';
import { ANNOUNCEMENT_TEMPLATES } from './src/sanity/announcementTemplates';
import { structure, everydayStructure } from './src/sanity/structure';
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
//  - "Everyday edits"  → /studio/#/everyday    publish-something-now tasks only
//  - "Everything"      → /studio/#/everything  adds School info / Community /
//                                              Site Settings / Menus / links
// (Under `npx sanity dev` it's browser routing at /studio/studio/<name> —
// dev-only quirk from sanity.cli's own /studio base.) /studio itself lands on
// the FIRST workspace (Everyday edits); the switcher in the top-left swaps
// between them. Both edit the same content — the trim is comfort, not
// permission (see docs/ROLES.md).
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
// - scheduledDrafts.enabled: true — per-document scheduling (publish at a future
//   date/time, like Squarespace/WordPress); Sanity fires the publish webhook on
//   schedule and the static site rebuilds then. NOTE: scheduling is a Growth-plan
//   feature — on the FREE plan the option won't appear, so this flag simply
//   activates it if/when the project upgrades. Harmless on free. (Same story for
//   Comments/Tasks and AI Assist, which we deliberately have NOT added.)
// - releases.enabled: false — the newer "Content Releases" bundle tool is more
//   than the board needs (it groups many docs into one scheduled release);
//   per-document scheduling above is the simpler fit, so we keep Releases off.
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
  if (['page', 'post', 'legalPage'].includes(schemaType)) {
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
    icon: WcpWorkspaceIcon,
    projectId,
    dataset,
    theme: wcpStudioTheme,
    releases: { enabled: false },
    scheduledDrafts: { enabled: true },
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
      // Singletons keep only their editing actions (no unpublish/delete/duplicate).
      // Review submissions get a one-click "Approve into Testimonials" action.
      actions: (prev, { schemaType }) => {
        if (schemaType === 'testimonialSubmission') return [ApproveTestimonialAction, ...prev];
        return SINGLETON_TYPES.has(schemaType)
          ? prev.filter(
              ({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action || ''),
            )
          : prev;
      },
      // Remove singletons from the global "create new document" menu.
      newDocumentOptions: (prev, { creationContext }) =>
        creationContext.type === 'global'
          ? prev.filter((option) => !SINGLETON_TYPES.has(option.templateId))
          : prev,
    },
  };
}

export default defineConfig([
  // First = where /studio lands. The everyday volunteer menu.
  workspace({
    name: 'everyday',
    title: 'Everyday edits',
    subtitle: 'The usual tasks',
    structure: everydayStructure,
  }),
  workspace({
    name: 'everything',
    title: 'Everything',
    subtitle: 'Every menu, incl. Site setup',
    structure,
    extraPlugins: [
      // Link Checker — a Studio tool that scans content for broken external
      // links and dangling document references, with one click to the offending
      // doc. Complements the CI link check (which only sees internal links in
      // the built site). Kept to the full workspace to keep Everyday's toolbar
      // small.
      linkChecker(),
    ],
    extraTools: [
      // Export — download subscribers / submissions / directory as a CSV, so
      // the board can move email providers or hand off without the developer.
      {
        name: 'export',
        title: 'Export',
        component: ExportTool,
        icon: () => '📤',
      },
      // Cleanup — bulk-delete old inbox records (handled messages, past RSVPs),
      // with a count preview + typed confirmation. Free-plan bulk delete.
      {
        name: 'cleanup',
        title: 'Clean up',
        component: CleanupTool,
        icon: () => '🧹',
      },
      // Checkup — read-only "what needs attention?" report (banner left on,
      // old messages, stale pages, class gaps).
      {
        name: 'checkup',
        title: 'Checkup',
        component: HealthTool,
        icon: () => '🩺',
      },
      // Start-of-year — a read-only guided checklist for the annual rollover
      // (year label, dates, tuition, hours goal, events, content refresh), each
      // card jumping straight to the thing to update.
      {
        name: 'setup',
        title: 'Start of year',
        component: SetupWizard,
        icon: () => '🍂',
      },
    ],
  }),
]);
