// =============================================================================
// Photo moments — where the code-owned PhotoStrip bands land, per page
// =============================================================================
// The boldness audit found the conversion pages are "icon deserts" (4-6 imgs,
// mostly chrome) while /a-day-at-wcp hoards ~96 photos. This map injects a
// PhotoStrip band (3 big taped prints from the registry) at a chosen position
// on each listed page. Code-owned on purpose: volunteers keep zero design
// knobs, and it ships while Sanity writes are quota-frozen.
//
// `after` = the strip renders after the section at that 0-based index of the
// page's sections array (clamped; -1 = before everything). Positions were
// picked from the live pages: early enough to break up the card/table runs,
// never interrupting a form or table mid-flow. Captions are evergreen lines in
// the site voice (no dates, no names).
// =============================================================================

export interface PhotoMoment {
  after: number;
  /** What renders: a 3-print strip (default), a full-bleed unscrimmed
      interlude (one photo owning the viewport, benchmark move), or the
      code-owned tuition opener statement. */
  kind?: 'strip' | 'interlude' | 'tuition-opener';
  slot: string;
  bg?: 'cream' | 'grey' | 'white';
  captions?: string[];
  /** Interlude only: the single caption sentence. */
  caption?: string;
}

export const PHOTO_MOMENTS: Record<string, PhotoMoment[]> = {
  home: [
    // The full-bleed interlude (benchmark move): one unscrimmed photo owning
    // a viewport, placed late in the page as the emotional beat before the
    // closing sections.
    {
      after: 7,
      kind: 'interlude',
      slot: 'home-interlude',
      caption: 'Some mornings you just have to be there for.',
    },
  ],
  'why-wcp': [
    {
      after: 0,
      slot: 'why-wcp-strip',
      captions: ['Hands-on, every morning', 'Friends by September', 'Real classrooms, real mess'],
    },
    {
      after: 4,
      kind: 'interlude',
      slot: 'why-wcp-interlude',
      caption: 'Every child known by name. Every parent in the room.',
    },
  ],
  tuition: [
    // The values-led opener leads the page (before every section).
    { after: -1, kind: 'tuition-opener', slot: 'tuition-opener' },
    {
      after: 1,
      slot: 'tuition-strip',
      captions: ['Mornings like this', 'Small classes, real attention', 'Worth every penny'],
    },
  ],
  enroll: [
    {
      after: 0,
      slot: 'enroll-strip',
      captions: ['Your first day starts here', 'Room for one more', 'Come say hello'],
    },
  ],
  safety: [
    {
      after: 1,
      slot: 'safety-strip',
      captions: ['Safe, sunny mornings', 'Every child known by name', 'Play, watched over'],
    },
  ],
  'co-op-life': [
    {
      after: 1,
      slot: 'coop-strip',
      captions: ['Parents in the room', 'The village at work', 'Snack time, handled'],
    },
  ],
};
