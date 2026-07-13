// =============================================================================
// CMS content client — for the Studio-only PREVIEW path (/preview/*)
// =============================================================================
// Mirrors src/lib/sanity.ts's request-time env-sourcing (the Worker runtime env
// via `cloudflare:workers`, not build-time `import.meta.env`), since preview
// pages are `prerender = false` and must read live draft content per request —
// unlike src/lib/cms.ts, which reads once at BUILD time for the static public
// pages. Never import this from a prerendered page.
//
// perspective/stega both switch on `draftMode`, which callers derive from the
// presence of the Presentation Tool's perspective cookie. There is no fallback
// argument here (unlike cmsFetch): a preview page should show real Sanity
// state, including empty/missing fields, so an editor notices a gap instead of
// silently seeing built-in fallback copy.
// =============================================================================
import { createClient, type SanityClient } from '@sanity/client';
import { env } from 'cloudflare:workers';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import { SITE_SETTINGS_QUERY } from '@/lib/queries';

// Fields chosen from a fixed dropdown / radio in the schema — NEVER free text an
// editor types, and never displayed as prose. They drive class and component
// selection in the .astro renderers (e.g. CtaBanner does `tone === 'navy'`, the
// Section band does `bg === 'navy'`, Icon looks the name up in a map). Stega
// encodes a ~1KB run of invisible marker characters into every string it touches
// so click-to-edit knows which field to open; on a DISPLAY string that is the
// whole point, but on one of these it silently breaks the exact-string
// comparison (`"navy" + <markers>` !== `"navy"`), so the preview mis-renders
// while the live static site is fine. Excluding them from stega loses nothing —
// you pick these from a list, there is no text to click into — and fixes the
// whole class of preview-only rendering drift at the source. See docs/PAGE_BUILDER.md.
const NON_STEGA_FIELDS = new Set([
  'tone',
  'background',
  'align',
  'accentColor',
  'chip',
  'source',
  'category',
  'tag',
  'columns',
  'layout',
  'mediaType',
  'height',
  'linkType',
  'style',
  'appearance',
  'icon',
  'season',
  // Drives expandRecurring() — a stega-encoded value would fail the
  // recurrence === 'weekly' check and quietly skip expansion in preview.
  'recurrence',
]);

export function getPreviewClient(draftMode: boolean): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: env.SANITY_TOKEN,
    perspective: draftMode ? 'drafts' : 'published',
    stega: {
      enabled: draftMode,
      studioUrl: '/studio',
      // Encode display strings (so they are click-to-edit) but skip the dropdown
      // fields above, whose exact values are used in rendering logic.
      filter: (props) =>
        NON_STEGA_FIELDS.has(String(props.sourcePath.at(-1))) ? false : props.filterDefault(props),
    },
  });
}

/** Run a GROQ query with the draft-aware preview client. */
export async function previewFetch<T>(
  draftMode: boolean,
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  return getPreviewClient(draftMode).fetch<T>(query, params);
}

interface SiteSettingsDoc {
  name?: string;
  shortName?: string;
  founded?: number;
  tagline?: string;
  url?: string;
  phone?: string;
  emailGeneral?: string;
  emailAdmin?: string;
  emailTreasurer?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  parkingNote?: string;
  schoolYearLabel?: string;
  enrolling?: boolean;
  closureStatement?: string;
  facebook?: string;
  instagram?: string;
  storeUrl?: string;
  license?: string;
  licenseAuthority?: string;
}

/**
 * Draft-aware mirror of src/lib/cms.ts's getSiteSettings — merges the Sanity
 * Site Settings singleton onto the static `site` object (data/site.ts), same
 * shape/fields, differing only in reading via previewFetch. Site identity
 * fields (phone/address) are structural, not editorial content to leave
 * blank, so merging over static defaults here is intentional (unlike page
 * hero/FAQ preview fetches, which show gaps as-is).
 */
export async function getPreviewSiteSettings<T extends Record<string, unknown>>(
  draftMode: boolean,
  fallback: T,
): Promise<T> {
  const doc = await previewFetch<SiteSettingsDoc | null>(draftMode, SITE_SETTINGS_QUERY, {});
  if (!doc || Object.keys(doc).length === 0) return fallback;

  const f = fallback as unknown as {
    name: string;
    shortName: string;
    founded: number;
    tagline: string;
    url: string;
    address: { street: string; city: string; state: string; zip: string };
    phone: string;
    email: { general: string; admin: string; contact: string; treasurer: string };
    teachers: { lisa: string; erin: string };
    license: string;
    licenseAuthority: string;
    calendar: string;
    social: { facebook: string; instagram: string };
  };

  return {
    ...f,
    name: doc.name ?? f.name,
    shortName: doc.shortName ?? f.shortName,
    founded: doc.founded ?? f.founded,
    tagline: doc.tagline ?? f.tagline,
    url: doc.url ?? f.url,
    address: {
      ...f.address,
      street: doc.street ?? f.address.street,
      city: doc.city ?? f.address.city,
      state: doc.state ?? f.address.state,
      zip: doc.zip ?? f.address.zip,
    },
    phone: doc.phone ?? f.phone,
    email: {
      ...f.email,
      general: doc.emailGeneral ?? f.email.general,
      admin: doc.emailAdmin ?? f.email.admin,
      treasurer: doc.emailTreasurer ?? f.email.treasurer,
    },
    license: doc.license ?? f.license,
    licenseAuthority: doc.licenseAuthority ?? f.licenseAuthority,
    calendar: doc.closureStatement ?? f.calendar,
    social: {
      ...f.social,
      facebook: doc.facebook ?? f.social.facebook,
      instagram: doc.instagram ?? f.social.instagram,
    },
  } as unknown as T;
}
