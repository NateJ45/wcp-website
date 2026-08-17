// =============================================================================
// Hub class facts — read from Sanity, fall back to the data file per field
// =============================================================================
// The gated hub class pages + tuition page show class facts (schedule, ages,
// tuition amounts) and the PayPal button id. Those live in the Sanity `class`
// docs (the same ones the public site reads and volunteers edit in the Studio),
// so the hub reads them from there. `src/data/classes.ts` is only a fallback for
// any field Sanity is missing, or if the gated read fails — a class card always
// renders. EXCEPT the decorative `icon`: that's a fixed brand/design choice, not
// volunteer content, so it's CODE-OWNED (from classes.ts, carried through by the
// `...base` spread below — the Sanity icon field is not read). That also keeps it
// identical to the home hub's class tiles (ClassHelperRow); the class page used to
// diverge because it read the icon from Sanity.
// =============================================================================
import { sanityFetch } from '@/lib/sanity';
import { classes, classBySlug, type WcpClass } from '@/data/classes';

// Only the fields the hub actually shows. `slug` matches the data-file slug.
// (No `icon` — that stays code-owned, see the note above.)
const CLASS_FACTS = `{
  "slug": slug.current, name, days, time, age, monthly, annual, studentFee, payId,
  studentFeePayId
}`;
const ALL_CLASSES_QUERY = `*[_type == "class"]${CLASS_FACTS}`;
const ONE_CLASS_QUERY = `*[_type == "class" && slug.current == $slug][0]${CLASS_FACTS}`;

interface ClassRow {
  slug?: string;
  name?: string;
  days?: string;
  time?: string;
  age?: string;
  monthly?: string;
  annual?: string;
  studentFee?: string;
  payId?: string;
  studentFeePayId?: string;
}

/** Overlay a Sanity row onto the data-file class, field by field. */
function merge(base: WcpClass, s?: ClassRow | null): WcpClass {
  if (!s) return base;
  return {
    // `...base` carries the code-owned `icon` through unchanged.
    ...base,
    name: s.name ?? base.name,
    days: s.days ?? base.days,
    time: s.time ?? base.time,
    age: s.age ?? base.age,
    monthly: s.monthly ?? base.monthly,
    annual: s.annual ?? base.annual,
    studentFee: s.studentFee ?? base.studentFee,
    payId: s.payId ?? base.payId,
    studentFeePayId: s.studentFeePayId ?? base.studentFeePayId,
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
