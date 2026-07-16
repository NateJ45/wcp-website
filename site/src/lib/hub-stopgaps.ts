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
// Each transform matches by CONTENT (not keys) and is a no-op when its target
// isn't present, so applyHubStopgaps() is safe to run on any handbook page.
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

/** Run every stopgap; each no-ops when its target isn't on the page. */
export function applyHubStopgaps(sections?: Section[]): Section[] {
  let s = sections ?? [];
  s = prekMergeSchedule(s);
  s = removeFacebookForPhotos(s);
  s = addClassDojoRegisterLink(s);
  return s;
}
