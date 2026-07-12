// =============================================================================
// Hub class facts — read from Sanity, fall back to the data file per field
// =============================================================================
// The gated hub class pages + tuition page show class facts (schedule, ages,
// tuition amounts) and the PayPal button id. Those live in the Sanity `class`
// docs (the same ones the public site reads and volunteers edit in the Studio),
// so the hub reads them from there. `src/data/classes.ts` is only a fallback for
// any field Sanity is missing, or if the gated read fails — a class card always
// renders. The decorative icon is passed through `safeIcon` so a mistyped icon
// name in the Studio can never 500 the page.
// =============================================================================
import { sanityFetch } from '@/lib/sanity';
import { classes, classBySlug, type WcpClass } from '@/data/classes';
import { safeIcon } from '@/lib/icons';

// Only the fields the hub actually shows. `slug` matches the data-file slug.
const CLASS_FACTS = `{
  "slug": slug.current, name, icon, days, time, age, monthly, annual, studentFee, payId
}`;
const ALL_CLASSES_QUERY = `*[_type == "class"]${CLASS_FACTS}`;
const ONE_CLASS_QUERY = `*[_type == "class" && slug.current == $slug][0]${CLASS_FACTS}`;

interface ClassRow {
  slug?: string;
  name?: string;
  icon?: string;
  days?: string;
  time?: string;
  age?: string;
  monthly?: string;
  annual?: string;
  studentFee?: string;
  payId?: string;
}

/** Overlay a Sanity row onto the data-file class, field by field. */
function merge(base: WcpClass, s?: ClassRow | null): WcpClass {
  if (!s) return base;
  return {
    ...base,
    name: s.name ?? base.name,
    icon: safeIcon(s.icon, base.icon),
    days: s.days ?? base.days,
    time: s.time ?? base.time,
    age: s.age ?? base.age,
    monthly: s.monthly ?? base.monthly,
    annual: s.annual ?? base.annual,
    studentFee: s.studentFee ?? base.studentFee,
    payId: s.payId ?? base.payId,
  };
}

/** All classes (data-file order preserved), facts + payId sourced from Sanity. */
export async function getHubClasses(): Promise<WcpClass[]> {
  let bySlug: Record<string, ClassRow> = {};
  try {
    const rows = await sanityFetch<ClassRow[]>(ALL_CLASSES_QUERY);
    for (const r of rows ?? []) if (r?.slug) bySlug[r.slug] = r;
  } catch {
    bySlug = {};
  }
  return classes.map((c) => merge(c, bySlug[c.slug]));
}

/** One class by slug, facts + payId sourced from Sanity (data-file fallback). */
export async function getHubClass(slug: WcpClass['slug']): Promise<WcpClass> {
  const base = classBySlug[slug];
  try {
    const s = await sanityFetch<ClassRow | null>(ONE_CLASS_QUERY, { slug });
    return merge(base, s);
  } catch {
    return base;
  }
}
