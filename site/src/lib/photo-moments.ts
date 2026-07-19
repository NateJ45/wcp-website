// =============================================================================
// Photo moments — where the code-owned PhotoStrip bands land, per page
// =============================================================================
// The boldness audit found the conversion pages are "icon deserts" (4-6 imgs,
// mostly chrome) while /a-day-at-wcp hoards ~96 photos. This map injects a
// PhotoStrip band (3 big taped prints from the registry) at a chosen position
// on each listed page. Code-owned on purpose: volunteers keep zero design
// knobs, and it ships while Sanity writes are quota-frozen.
//
// `after` = WHERE the moment renders: prefer a section _key (resolved against
// the final rendered order, so it survives the Act II doctrine drops/hoists);
// a 0-based index (legacy) still works for pages with no doctrine reorder;
// -1 = before everything. Captions are evergreen lines in the site voice (no
// dates, no names) and MUST stay true for any registry photo (the Phase 0
// audit caught "Parents in the room" captioning a hayride tractor — a caption
// that describes a specific scene is a trust wound when the deterministic
// photo pick changes).
// =============================================================================

export interface PhotoMoment {
  /** Section _key (preferred) or 0-based index; -1 = before everything. */
  after: number | string;
  /** What renders: a 3-print strip (default), a full-bleed unscrimmed
      interlude (one photo owning the viewport, benchmark move), the
      code-owned tuition opener statement, the home heritage strip
      ("Fifty-five Septembers"), the chooser rows (self-segmentation), the
      About page's Septembers wall (every school year since 1969 on one
      horizontal scrapbook rail), or the visit block (photo + address/phone/
      CTAs, replacing the Sanity hp-visit proseSection that has no image
      slot). */
  kind?: 'strip' | 'interlude' | 'tuition-opener' | 'heritage' | 'chooser' | 'septembers' | 'visit';
  slot: string;
  bg?: 'cream' | 'grey' | 'white';
  captions?: string[];
  /** Interlude only: the single caption sentence. */
  caption?: string;
}

export const PHOTO_MOMENTS: Record<string, PhotoMoment[]> = {
  home: [
    // Self-segmentation chooser (2026 benchmark move): three tappable rows
    // routing "just looking / comparing / ready" straight to A Day, Tuition,
    // and the tour form. First band under the hero: the funnel as furniture.
    { after: -1, kind: 'chooser', slot: 'home-chooser' },
    // The heritage strip replaces the stat-box band's slot (after the class
    // cards): the 1969 story as the page's proof moment, ending in the empty
    // frame that IS the tour invitation.
    { after: 'hp-classes', kind: 'heritage', slot: 'home-heritage' },
    // The full-bleed interlude (benchmark move): one unscrimmed photo owning
    // a viewport, placed late in the page as the emotional beat before the
    // closing sections.
    {
      after: 'k12',
      kind: 'interlude',
      slot: 'home-interlude',
      caption: 'Some mornings you just have to be there for.',
    },
    // The visit block replaces the Sanity hp-visit proseSection (dropped in
    // page-doctrine): the old site paired these details with a photo, and a
    // proseSection has no image slot.
    { after: 'hp-instagram', kind: 'visit', slot: 'home-visit' },
  ],
  'why-wcp': [
    {
      after: 'k179',
      slot: 'why-wcp-strip',
      captions: ['Hands-on, every morning', 'Friends by September', 'Real classrooms, real mess'],
    },
    {
      after: 'k197',
      kind: 'interlude',
      slot: 'why-wcp-interlude',
      caption: 'Every child known by name. Every parent in the room.',
    },
  ],
  tuition: [
    // The values-led opener leads the page (before every section).
    { after: -1, kind: 'tuition-opener', slot: 'tuition-opener' },
    // After the fee table (hoisted first by the Act II doctrine): the warmth
    // right behind the numbers.
    {
      after: 'k53',
      slot: 'tuition-strip',
      captions: ['Mornings like this', 'Small classes, real attention', 'Worth every penny'],
    },
  ],
  enroll: [
    {
      after: 'seed-enroll-steps',
      slot: 'enroll-strip',
      captions: ['Your first day starts here', 'Room for one more', 'Come say hello'],
    },
  ],
  about: [
    // The Septembers wall: the About page owns the deep-history moment (home
    // keeps the shorter heritage strip). After the intro prose (k26).
    { after: 'k26', kind: 'septembers', slot: 'septembers-wall' },
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
      // Photo-agnostic on purpose (see the header note).
      captions: ['Mornings together', 'The village at work', 'Worth showing up for'],
    },
  ],
};
