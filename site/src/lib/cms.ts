import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import {
  STAFF_QUERY,
  CLASS_FACTS_QUERY,
  SITE_SETTINGS_QUERY,
  SCHOOL_YEAR_EVENTS_QUERY,
  NAVIGATION_QUERY,
  testimonialsQuery,
} from '@/lib/queries';
import { resolveNavigation, type SiteNavigation } from '@/lib/nav';

// =============================================================================
// CMS content client — for PUBLIC (static / prerendered) pages
// =============================================================================
// The public marketing pages are built ahead of time, so they read Sanity at
// BUILD time in Node — the token comes from the build env (.env → import.meta.env),
// NOT the Cloudflare Worker runtime. Private/PII content stays in the gated SSR
// path (src/lib/sanity.ts, which uses the Worker runtime env).
//
// cmsFetch always takes a fallback and never throws: if Sanity is unreachable or
// the query returns nothing, the page keeps its built-in content. That means a
// build can never be broken by the CMS, and empty fields fall back gracefully.
// =============================================================================
const token = import.meta.env.SANITY_TOKEN as string | undefined;

export const cms = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
  perspective: 'published',
});

export async function cmsFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: T,
): Promise<T> {
  if (!token) return fallback;
  try {
    const data = await cms.fetch<T>(query, params);
    if (data === null || data === undefined) return fallback;
    if (Array.isArray(data) && data.length === 0) return fallback;
    return data;
  } catch {
    return fallback;
  }
}

// -----------------------------------------------------------------------------
// Shared shapes + helpers used across pages that read `staff` / `class` docs.
// -----------------------------------------------------------------------------
interface PortableBlock {
  _type: string;
  children?: { text?: string }[];
}

/** Portable Text -> plain paragraph strings (drops formatting, keeps text). */
export function toParagraphs(blocks?: PortableBlock[]): string[] {
  return (blocks ?? [])
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .filter(Boolean);
}

export interface StaffDoc {
  name: string;
  honorific?: string;
  role?: string;
  years?: string;
  email?: string;
  pullQuote?: string;
  bio?: PortableBlock[];
}

/** Fetch one staff member by document id (e.g. "staff-erin"), for a teacher card. */
export async function getStaff(id: string): Promise<StaffDoc | null> {
  return cmsFetch<StaffDoc | null>(STAFF_QUERY, { id }, null);
}

export interface ClassFactsDoc {
  name: string;
  days?: string;
  daysCount?: string;
  time?: string;
  age?: string;
  classSizeCap?: number;
  monthly?: string;
  annual?: string;
  studentFee?: string;
}

/** Fetch one class's schedule/tuition facts by document id (e.g. "class-twos"). */
export async function getClassFacts(id: string): Promise<ClassFactsDoc | null> {
  return cmsFetch<ClassFactsDoc | null>(CLASS_FACTS_QUERY, { id }, null);
}

export interface TestimonialDoc {
  quote: string;
  author?: string;
  role?: string;
  tags?: string[];
  featured?: boolean;
}

/**
 * Fetch testimonials (edited in Sanity), optionally filtered by tag and/or
 * featured. Pass a `fallback` (usually the local data/testimonials.ts array)
 * so pages keep working if Sanity has none.
 */
export async function getTestimonials(
  opts: { tag?: string; featuredOnly?: boolean; limit?: number } = {},
  fallback: TestimonialDoc[] = [],
): Promise<TestimonialDoc[]> {
  const { tag } = opts;
  const query = testimonialsQuery(opts);
  const result = await cmsFetch<TestimonialDoc[]>(query, tag ? { tag } : {}, []);
  return result.length > 0 ? result : fallback;
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
 * Merge the Sanity Site Settings singleton onto the static `site` object
 * (data/site.ts), field by field — Sanity wins where set, otherwise the
 * static value is kept. Shaped identically to `site`, so callers can shadow
 * the import (`const site = await getSiteSettings(siteFallback)`) and every
 * existing `site.phone` / `site.email.general` reference keeps working.
 */
export async function getSiteSettings<T extends Record<string, unknown>>(fallback: T): Promise<T> {
  const doc = await cmsFetch<SiteSettingsDoc>(SITE_SETTINGS_QUERY, {}, {});
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

export interface SchoolYearEventDoc {
  month: string;
  title: string;
  body: string;
  icon: string;
  accent: 'orange' | 'sky' | 'amber' | 'green';
}

/** Fetch the school-year events (edited in Sanity), falling back to the local list. */
export async function getSchoolYearEvents(
  fallback: SchoolYearEventDoc[] = [],
): Promise<SchoolYearEventDoc[]> {
  return cmsFetch<SchoolYearEventDoc[]>(SCHOOL_YEAR_EVENTS_QUERY, {}, fallback);
}

/**
 * Fetch the editable site navigation (Menus) from Sanity, resolved to the
 * NavItem/NavGroup shapes Header/Footer expect, falling back to src/data/nav.ts
 * when the Studio has none. Build-time (static pages).
 */
export async function getNavigation(): Promise<SiteNavigation> {
  const doc = await cmsFetch<unknown>(NAVIGATION_QUERY, {}, null);
  return resolveNavigation(doc);
}
