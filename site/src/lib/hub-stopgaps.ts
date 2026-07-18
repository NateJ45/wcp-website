// =============================================================================
// hub-stopgaps.ts — TEMPORARY code-side content edits (Sanity write quota maxed)
// =============================================================================
// 2026-07-15: the Sanity mutation API hit its plan quota (`plan_limit_reached`),
// so a handful of Board content edits can't be saved in the Studio yet. Reads
// still work (CDN), so we apply these specific edits IN CODE, layered over the
// sections we read from Sanity, until the quota is back.
//
// >>> REMOVE THIS FILE and its two call sites (pre-k.astro, twos-threes.astro)
//     once the same edits are made in Sanity. Until then the Studio shows the
//     OLD content; only the rendered page reflects these. See the Sanity
//     follow-up list in memory (project-wcp-pending-directory-patch). <<<
//
// Each EDITING transform matches by CONTENT (not keys) and is a no-op when its
// target isn't present, so applyHubStopgaps() is safe to run on any handbook
// page. Transforms that ADD a section have nothing to content-match on, so they
// are scoped by the `page` argument instead (see twosClassPet).
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
type Section = Record<string, any>;

const CLASSDOJO_REGISTER_URL =
  'https://www.classdojo.com/ul/p/addKid?target=school&schoolID=68c6cf034709b1f40c668049';

/** Neutralise the two AM-only phrases so a merged AM/PM row reads for both. */
function neutralise(desc?: string): string | undefined {
  return (
    (desc ?? '')
      .replace(
        'Morning routine, then hands-on play with the morning tubs.',
        'Arrival routine, then hands-on play with the tubs.',
      )
      .replace('The heart of the morning:', 'The heart of the session:') || undefined
  );
}

/**
 * Pre-K: fold the near-identical "A morning in Pre-K" + "An afternoon in Pre-K"
 * schedules into ONE, pairing each activity's AM and PM time (PM shown in the
 * PM colour via the schedule's `timePm`), and retitle for both classes.
 */
export function prekMergeSchedule(sections: Section[]): Section[] {
  const list = [...(sections ?? [])];
  const am = list.find(
    (s) => s?._type === 'scheduleSection' && /morning/i.test(s.header?.title ?? ''),
  );
  const pm = list.find(
    (s) => s?._type === 'scheduleSection' && /afternoon/i.test(s.header?.title ?? ''),
  );
  if (!am || !pm) return list; // already merged / edited

  const amEntries: Section[] = am.entries ?? [];
  const pmEntries: Section[] = pm.entries ?? [];
  const entries = amEntries.map((m, i) => ({
    _type: 'entry',
    _key: `prek-day-${i}`,
    time: m.time,
    timePm: pmEntries[i]?.time,
    title: m.title,
    description: neutralise(m.description),
  }));

  const merged: Section = {
    ...am,
    _key: 'prek-day-merged',
    header: { ...(am.header ?? {}), title: 'A day in Pre-K' },
    intro:
      'The same happy rhythm morning and afternoon. AM class times are in orange, PM class times in blue.',
    entries,
  };

  const amIdx = list.indexOf(am);
  list[amIdx] = merged;
  const pmIdx = list.indexOf(pm);
  if (pmIdx >= 0) list.splice(pmIdx, 1);
  return list;
}

/**
 * Replace any "Private Facebook group" card with a Google Photos pointer.
 * ClassDojo has replaced the class Facebook group this year; daily photos now
 * live in each class's private Google Photos album (linked in the class cards
 * at the top of the page, so no single link works on the shared Twos/Threes
 * page).
 */
export function removeFacebookForPhotos(sections: Section[]): Section[] {
  return (sections ?? []).map((s) => {
    if (s?._type !== 'cardGridSection' || !Array.isArray(s.cards)) return s;
    if (!s.cards.some((c: Section) => /facebook/i.test(c?.title ?? ''))) return s;
    const cards = s.cards.map((c: Section) =>
      /facebook/i.test(c?.title ?? '')
        ? {
            ...c,
            icon: 'camera',
            title: 'Class photos',
            body: "Daily classroom photos are posted in your class's private Google Photos album, linked in the class cards at the top of this page.",
            href: undefined,
            linkLabel: undefined,
          }
        : c,
    );
    return { ...s, cards };
  });
}

/** Add the ClassDojo registration link to any "ClassDojo" info card. */
export function addClassDojoRegisterLink(sections: Section[]): Section[] {
  return (sections ?? []).map((s) => {
    if (s?._type !== 'cardGridSection' || !Array.isArray(s.cards)) return s;
    if (!s.cards.some((c: Section) => /classdojo/i.test(c?.title ?? ''))) return s;
    const cards = s.cards.map((c: Section) =>
      /classdojo/i.test(c?.title ?? '')
        ? { ...c, href: CLASSDOJO_REGISTER_URL, linkLabel: 'Register your child on ClassDojo' }
        : c,
    );
    return { ...s, cards };
  });
}

/**
 * Twos & Threes: add the class-pet section (Kit the Kat) immediately ABOVE the
 * closing CTA, mirroring the Pre-K handbook's Pickles blurb.
 *
 * Unlike the other stopgaps this one can't match on content — it ADDS a section
 * rather than editing one — so it is page-scoped by the caller instead. It
 * renders through the code-owned `classPetSection` type (see
 * components/sections/ClassPetSection.astro) because the photo can't be
 * uploaded to Sanity while writes are quota-blocked. Idempotent: no-op once a
 * real section carrying the pet is present.
 */
export function twosClassPet(sections: Section[]): Section[] {
  const list = [...(sections ?? [])];
  if (
    list.some((s) => s?._type === 'classPetSection' || /kit the kat/i.test(s?.header?.title ?? ''))
  ) {
    return list;
  }
  // The CLOSING CTA is the last one; a mid-handbook CTA must not catch this.
  const ctaIdx = list.map((s) => s?._type).lastIndexOf('ctaSection');
  if (ctaIdx < 0) return list; // no CTA to sit above: leave the page untouched

  const petSection: Section = {
    _type: 'classPetSection',
    _key: 'twos-pet-kit',
    background: 'white',
    header: { _type: 'sectionHeader', title: 'Meet Kit the Kat, our class pet' },
    body: 'Kit the Kat is our class pet, shared by the Twos and the Threes. Starting in October, each child gets a weekend with Kit: take Kit everywhere, snap photos or draw pictures of the adventures (Kit at the playground! Kit at the dinner table!), and bring the backpack and story binder back to share with the class.',
    alt: 'Kit the Kat, a plush cat, sitting on the playground next to a smiling child in a bike helmet.',
  };

  list.splice(ctaIdx, 0, petSection);
  return list;
}

/**
 * Twos & Threes curriculum: put Easter + food and nutrition back in MARCH.
 *
 * The stored month-by-month schedule has them in April, so March reads
 * "St. Patrick's Day, fire safety" and April carries six topics. Erin's
 * curriculum sheet has them in March and leaves April as spring, insects,
 * rocks, weather. Content-matched on the misplaced Easter entry, so it
 * no-ops the moment the Sanity doc is corrected.
 */
export function twosCurriculumMonths(sections: Section[]): Section[] {
  return (sections ?? []).map((s) => {
    if (s?._type !== 'scheduleSection' || !Array.isArray(s.entries)) return s;
    const mar = s.entries.find((e: Section) => e?.time === 'Mar');
    const apr = s.entries.find((e: Section) => e?.time === 'Apr');
    // The MISPLACED EASTER is what identifies the curriculum schedule — not the
    // month rows. This page carries a second month-keyed scheduleSection (the
    // field trips: Mar "Local fire station", Apr "Creeking"), so a Mar/Apr test
    // alone would match that one too. Keep the content guard.
    if (!mar || !apr || !/easter/i.test(apr.title ?? '')) return s;
    const entries = s.entries.map((e: Section) => {
      if (e?.time === 'Mar') {
        return { ...e, title: 'St. Patrick’s Day, fire safety, Easter, food and nutrition' };
      }
      if (e?.time === 'Apr') return { ...e, title: 'Spring, insects, rocks, weather' };
      return e;
    });
    return { ...s, entries };
  });
}

/**
 * Run every stopgap; each no-ops when its target isn't on the page.
 * `page` scopes the stopgaps that ADD content (and so can't match on content):
 * pass the handbook's class key, e.g. 'twos'.
 */
export function applyHubStopgaps(sections?: Section[], page?: string): Section[] {
  let s = sections ?? [];
  s = prekMergeSchedule(s);
  s = removeFacebookForPhotos(s);
  s = addClassDojoRegisterLink(s);
  s = twosCurriculumMonths(s);
  if (page === 'twos') s = twosClassPet(s);
  return s;
}
