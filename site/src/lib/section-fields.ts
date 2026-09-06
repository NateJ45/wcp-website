// =============================================================================
// section-fields — which sections carry which in-canvas controls (2026-08-28)
// =============================================================================
// The in-canvas overlay (the floating controls that hover over a section in the
// Presentation preview) has to answer one question before it draws anything:
// DOES THIS SECTION ACTUALLY HAVE THIS FIELD? A band-colour card over a section
// whose type has no `background` field would write a field the schema does not
// know about, and a volunteer would click a colour and see nothing happen.
//
// The overlay cannot ask the Studio's schema for the answer. It runs inside the
// preview iframe, in the site's own bundle, and the schema lives in the parent
// window. So the answer is a REGISTRY, here, and the registry is kept honest by
// src/lib/section-fields.test.ts, which reads the schema files and the bridge
// components and FAILS if a section gains or loses one of these fields without
// this file being updated. Same discipline as the token gate in
// theme-tokens.test.ts: the duplicated knowledge is allowed only because a test
// measures the duplicate.
//
// This file also holds the PURE decisions the in-canvas controls make — which
// control an element gets, which field a text card writes to, which heading an
// underlined word is matched against — so that the React components in
// src/components/preview/overlay/ are left holding only what a browser has to
// do.
//
// THIS SITE'S OWN VOCABULARY. It is not presacademy's, and it predates it:
//   - the band colour is `background` (white / grey / cream / navy) on 37
//     section types, from `bandFields()` in the schema's _shared.ts;
//   - `ctaSection` is the odd one out and calls its band `tone` (navy / cream);
//   - `statBandSection` has NO band field, although its bridge READS one (the
//     renderer's navy-adjacency pass writes it back). A field a volunteer
//     cannot see is not a field this layer may offer;
//   - the underlined word is `headingAccent`, and it sits on the shared
//     `sectionHeader` object, so its path is `…header.headingAccent`, one level
//     deeper than a section field.
// =============================================================================

import { cleanHeadingText, emphasisRuns, hasEmphasis, type InlineRun } from '@/lib/emphasis';
import { normalizeRuns } from '@/lib/inline-rich-write';
import { sectionCoach } from '@/lib/section-coach';
import {
  parseSanityPath,
  readSectionPath,
  sectionByKey,
  type PathSegment,
} from '@/lib/sanity-path';
import type { SectionData } from '@/components/sections/section-helpers';

/**
 * The page-builder array field in this schema. A section is an item in it. Both
 * the `page` document and the `hubPage` document name it the same way, so one
 * literal covers every surface the preview renders.
 *
 * `readSectionPath` is canonical and TAKES these names rather than baking any
 * repo's in, so the list lives here beside the rest of this schema's vocabulary.
 */
export const SECTION_ARRAY_FIELDS: readonly string[] = ['sections'];

// -----------------------------------------------------------------------------
// The band: one designed choice, under two field names
// -----------------------------------------------------------------------------

/** One band colour an editor may pick, and how it is drawn in the card. */
export interface BandChoice {
  /** The stored value. */
  value: string;
  /** The Studio's own wording for it, so the two lists read the same. */
  title: string;
  /** One line under the title. */
  hint: string;
  /** The classes Section.astro puts on the <section> for this value. */
  className: string;
  /** The swatch, light theme. */
  dot: string;
  /** The swatch, dark theme. */
  dotDark: string;
}

/**
 * The four bands, in the schema's own order (BACKGROUND_OPTIONS in
 * src/sanity/schemaTypes/objects/_shared.ts). `className` mirrors
 * Section.astro's `bgClasses` map exactly, because the card swaps those classes
 * on the band the instant a colour is clicked; the drift gate reads both.
 */
export const BAND_OPTIONS: readonly BandChoice[] = [
  {
    value: 'white',
    title: 'White',
    hint: 'The plain page.',
    className: 'bg-white dark:bg-surface',
    dot: '#ffffff',
    dotDark: '#1b2531',
  },
  {
    value: 'grey',
    title: 'Light grey',
    hint: 'A quiet step away from white.',
    className: 'bg-grey',
    dot: '#eff0f1',
    dotDark: '#161f2c',
  },
  {
    value: 'cream',
    title: 'Warm cream',
    hint: 'The warm band. Carries a doodle.',
    className: 'bg-cream',
    dot: '#fff4e0',
    dotDark: '#241a12',
  },
  {
    value: 'sunshine',
    title: 'Sunshine (bold warm)',
    hint: 'The loudest warm band.',
    className: 'bg-sunshine',
    dot: '#ffa334',
    dotDark: '#3b2a0d',
  },
  {
    value: 'sky',
    title: 'Sky (soft blue)',
    hint: 'A cool, calm field.',
    className: 'bg-sky-soft',
    dot: '#eaf6fd',
    dotDark: '#10222c',
  },
  {
    value: 'navy',
    title: 'Navy (dark band)',
    hint: 'White text on deep navy.',
    className: 'bg-navy text-white [&_:is(h1,h2,h3,h4,h5,h6)]:text-white',
    dot: '#01457e',
    dotDark: '#01457e',
  },
];

/** A band value to its entry, for the class swap and the tick. */
export const BAND_BY_VALUE: Readonly<Record<string, BandChoice>> = Object.fromEntries(
  BAND_OPTIONS.map((band) => [band.value, band]),
);

/** `ctaSection` offers two of the four. Its schema list, in its own order. */
export const TONE_VALUES: readonly string[] = ['navy', 'cream'];

/**
 * Every section type carrying `bandFields()`, and therefore a `background`
 * field. Listed in the order the types appear in the schema files.
 *
 * `ctaSection` is NOT here: it carries `tone` instead. `noticeBarSection` is a
 * thin strip and has no band. `statBandSection` has no band FIELD, only a
 * renderer fallback, so an editor has nothing to set and this layer offers
 * nothing.
 */
export const BAND_SECTION_TYPES: readonly string[] = [
  'proseSection',
  'contactDetailsSection',
  'latestPostsSection',
  'upcomingEventsSection',
  'cardGridSection',
  'programCardsSection',
  'boardMembersSection',
  'logoStripSection',
  'campaignSection',
  'jobsSection',
  'downloadsSection',
  'albumSection',
  'instagramSection',
  'videoSection',
  'mapSection',
  'accordionSection',
  'quickFactsSection',
  'pullQuoteSection',
  'countdownSection',
  'formSection',
  'newsletterSignupSection',
  'reviewFormSection',
  'testimonialSection',
  'teacherSection',
  'classCardsSection',
  'faqSection',
  'schoolYearSection',
  'tuitionTableSection',
  'tuitionCalculatorSection',
  'enrollmentCtaSection',
  'scheduleSection',
  'stepListSection',
  'compareSection',
  'gallerySection',
  'storyTimelineSection',
  'splitMediaSection',
  'tabsSection',
];

/** The one type whose band field is `tone`. */
export const TONE_SECTION_TYPES: readonly string[] = ['ctaSection'];

/**
 * The name of the band field on this section type, or null when the type has no
 * band an editor may set. This is the field the in-canvas handle points at, so
 * it decides where the handle can exist at all.
 */
export function bandFieldFor(type?: string | null): 'background' | 'tone' | null {
  const name = String(type ?? '');
  if (BAND_SECTION_TYPES.includes(name)) return 'background';
  if (TONE_SECTION_TYPES.includes(name)) return 'tone';
  return null;
}

/**
 * The choices this section type offers, each list in ITS OWN schema order. The
 * two lists do not agree on order (the CTA's radio puts navy first), and the
 * card must read the way the form reads.
 */
export function bandChoicesFor(type?: string | null): readonly BandChoice[] {
  const field = bandFieldFor(type);
  if (field === 'background') return BAND_OPTIONS;
  if (field === 'tone') return TONE_VALUES.map((value) => BAND_BY_VALUE[value]);
  return [];
}

/**
 * Does the band card ACTUALLY APPLY to this section instance?
 *
 * Carrying the field is not the same as having a band to recolour. In the
 * preview a section that holds none of its own content renders as
 * `SectionCoach` — a dashed "here is what goes here" note, a plain <div>, with
 * no <section> and no band classes at all (see src/lib/section-coach.ts and
 * SectionRenderer.astro). Offering a colour there would put a knob on something
 * that cannot wear it, so both the handle and the card gate through this, PER
 * INSTANCE, exactly as presacademy gates its own art-directed opt-out.
 */
export function bandApplies(
  type?: string | null,
  section?: Record<string, unknown> | null,
): boolean {
  if (bandFieldFor(type) === null) return false;
  if (!section) return false;
  return sectionCoach(section as unknown as SectionData) === null;
}

/** The band value this section currently STORES, or '' when it has none. */
export function storedBand(type?: string | null, section?: Record<string, unknown> | null): string {
  const field = bandFieldFor(type);
  if (!field || !section) return '';
  const value = section[field];
  return typeof value === 'string' ? cleanHeadingText(value) : '';
}

// -----------------------------------------------------------------------------
// The underlined word
// -----------------------------------------------------------------------------
// `headingAccent` is declared in exactly two places in this schema, and the
// heading it is matched against is called `title` in both:
//
//   sectionHeader.headingAccent  -> sectionHeader.title   (34 section types)
//   ctaSection.headingAccent     -> ctaSection.title      (the banner headline)
//
// The hero's long-standing `accentWord` is the same idea under a different name.
// It is deliberately NOT offered here: this layer covers the two fields card 26
// added, and the drift gate below counts them, so a third one cannot appear
// without somebody deciding to add it.

/** Section types carrying a `header` of type `sectionHeader`. */
export const HEADER_SECTION_TYPES: readonly string[] = [
  'proseSection',
  'latestPostsSection',
  'upcomingEventsSection',
  'cardGridSection',
  'programCardsSection',
  'boardMembersSection',
  'logoStripSection',
  'campaignSection',
  'jobsSection',
  'downloadsSection',
  'albumSection',
  'instagramSection',
  'videoSection',
  'mapSection',
  'accordionSection',
  'quickFactsSection',
  'countdownSection',
  'formSection',
  'newsletterSignupSection',
  'reviewFormSection',
  'testimonialSection',
  'teacherSection',
  'classCardsSection',
  'faqSection',
  'schoolYearSection',
  'tuitionTableSection',
  'tuitionCalculatorSection',
  'scheduleSection',
  'stepListSection',
  'compareSection',
  'gallerySection',
  'storyTimelineSection',
  'splitMediaSection',
  'tabsSection',
];

/** The heading field name, whichever container the accent lives on. */
export const HEADING_FIELD = 'title';
/** The accent field name, in both places it is declared. */
export const HEADING_ACCENT_FIELD = 'headingAccent';

/** What the word picker edits, once the document has said what this is. */
export interface AccentTarget {
  /** Where the heading text is read from. */
  headingPath: PathSegment[];
  /** Where the chosen word is written. */
  accentPath: PathSegment[];
}

/**
 * Work out which heading a clicked element is, and where its underlined word is
 * stored. Returns null for everything else, which is what makes the control
 * disappear rather than write somewhere unexpected.
 */
export function resolveAccentTarget(
  doc: Record<string, unknown>,
  path?: string | null,
): AccentTarget | null {
  const section = readSectionPath(path, SECTION_ARRAY_FIELDS);
  if (!section) return null;
  const item = sectionByKey(doc, section.array, section.key);
  if (!item) return null;
  const type = typeof item._type === 'string' ? item._type : '';

  // The banner headline: `sections[k].title`, accent alongside it.
  if (
    TONE_SECTION_TYPES.includes(type) &&
    section.rest.length === 1 &&
    section.rest[0] === HEADING_FIELD
  ) {
    return {
      headingPath: [...section.itemPath, HEADING_FIELD],
      accentPath: [...section.itemPath, HEADING_ACCENT_FIELD],
    };
  }

  // A section heading: `sections[k].header.title`, accent inside the header.
  if (
    HEADER_SECTION_TYPES.includes(type) &&
    section.rest.length === 2 &&
    section.rest[0] === 'header' &&
    section.rest[1] === HEADING_FIELD
  ) {
    return {
      headingPath: [...section.itemPath, 'header', HEADING_FIELD],
      accentPath: [...section.itemPath, 'header', HEADING_ACCENT_FIELD],
    };
  }

  return null;
}

// -----------------------------------------------------------------------------
// The rich twins
// -----------------------------------------------------------------------------
// Seven plain-string fields each grew a sibling of type `emphasisText` in card
// 26. The pair is not always on the section itself: three of the seven live on
// a nested object (the shared header, a card, a row), so a twin is described by
// the CONTAINER it sits on, not by the section type alone.

/** A curated plain-string field and the rich twin that supersedes it. */
export interface RichTwin {
  /** The container this pair lives on, as the schema names it. */
  owner: string;
  /** The plain string field, still stored and still the fallback. */
  plain: string;
  /** The `emphasisText` twin. */
  rich: string;
  /** The field's name as the card shows it. */
  label: string;
}

/** The seven twins, keyed by the container that owns them. */
export const RICH_TWINS: Readonly<Record<string, RichTwin>> = {
  sectionHeader: { owner: 'sectionHeader', plain: 'lead', rich: 'leadRich', label: 'Intro line' },
  heroObject: { owner: 'heroObject', plain: 'lead', rich: 'leadRich', label: 'Intro line' },
  ctaSection: { owner: 'ctaSection', plain: 'lead', rich: 'leadRich', label: 'Intro line' },
  iconCard: { owner: 'iconCard', plain: 'body', rich: 'bodyRich', label: 'Text' },
  step: { owner: 'step', plain: 'body', rich: 'bodyRich', label: 'Text' },
  row: { owner: 'row', plain: 'body', rich: 'bodyRich', label: 'Text' },
  scheduleSection: {
    owner: 'scheduleSection',
    plain: 'intro',
    rich: 'introRich',
    label: 'Intro line',
  },
};

/**
 * Where each twin hangs, as a path shape under one section item. `array` names
 * the row array for the three twins that live on a row, and is undefined for the
 * three that sit directly on the section or its header.
 */
interface TwinLocation {
  owner: string;
  /** The section `_type` this location belongs to, or null for "any with a header". */
  sectionType: string | null;
  /** Path steps between the section item and the container. */
  under: 'section' | 'header' | 'row';
  /** The row array's field name, for `under: 'row'`. */
  array?: string;
}

const TWIN_LOCATIONS: readonly TwinLocation[] = [
  { owner: 'sectionHeader', sectionType: null, under: 'header' },
  { owner: 'ctaSection', sectionType: 'ctaSection', under: 'section' },
  { owner: 'scheduleSection', sectionType: 'scheduleSection', under: 'section' },
  { owner: 'iconCard', sectionType: 'cardGridSection', under: 'row', array: 'cards' },
  { owner: 'step', sectionType: 'stepListSection', under: 'row', array: 'steps' },
  { owner: 'row', sectionType: 'splitMediaSection', under: 'row', array: 'rows' },
];

/** Every field name either half of a twin can be called, as one flat set. */
export const RICH_TWIN_FIELD_NAMES: ReadonlySet<string> = new Set(
  Object.values(RICH_TWINS).flatMap((twin) => [twin.plain, twin.rich]),
);

/** The row arrays a twin can live inside, for the synchronous path gate. */
const ROW_ARRAYS: ReadonlySet<string> = new Set(
  TWIN_LOCATIONS.filter((spot) => spot.under === 'row').map((spot) => spot.array as string),
);

/** The hero's own path on a page document, and its plain headline field. */
export const HERO_FIELD = 'hero';
export const HERO_HEADLINE = { field: 'title', label: 'Headline', rows: 2 } as const;

// -----------------------------------------------------------------------------
// What a text card is editing
// -----------------------------------------------------------------------------

/** The resolved subject of the text card. */
export interface TextTarget {
  kind: 'plain' | 'rich';
  /** Where the value is written. */
  path: PathSegment[];
  /** Plain kind: the current string. */
  text: string;
  /** Rich kind: the current value, as runs. */
  runs: InlineRun[];
  /** The field's name as the card shows it. */
  label: string;
  /** Rows for the textarea. */
  rows: number;
}

/** Build a rich target from a container object and its twin. */
function richTarget(
  container: Record<string, unknown> | null,
  containerPath: PathSegment[],
  twin: RichTwin,
): TextTarget | null {
  if (!container) return null;
  const stored = container[twin.rich];
  const fallback = container[twin.plain];
  return {
    kind: 'rich',
    path: [...containerPath, twin.rich],
    text: '',
    // A twin that is still empty is seeded from the PLAIN string it falls back
    // to, so a volunteer's first bold keeps the words that were already there.
    runs: hasEmphasis(stored)
      ? emphasisRuns(stored)
      : normalizeRuns([
          {
            text: typeof fallback === 'string' ? cleanHeadingText(fallback) : '',
            strong: false,
            em: false,
          },
        ]),
    label: twin.label,
    rows: 3,
  };
}

/**
 * Work out what a clicked element edits, from the path it carries and the
 * document as it currently stands. Returns null for anything the card does not
 * offer, which is what makes the pencil disappear rather than write somewhere
 * unexpected.
 *
 * A path may run PAST the field, into a span inside a rich twin
 * (`…bodyRich[_key="b"].children[_key="c"].text`). Clicking the rendered words
 * and clicking the field are the same gesture, so both open the same card.
 */
export function resolveTextTarget(
  doc: Record<string, unknown>,
  path?: string | null,
): TextTarget | null {
  const section = readSectionPath(path, SECTION_ARRAY_FIELDS);

  if (!section) {
    // A document field. Only the hero's two lines are offered.
    const segments = parseSanityPath(path);
    if (segments[0] !== HERO_FIELD || typeof segments[1] !== 'string') return null;
    const hero = (doc?.[HERO_FIELD] ?? null) as Record<string, unknown> | null;
    const name = segments[1];
    if (name === HERO_HEADLINE.field && segments.length === 2) {
      const value = hero?.[name];
      return {
        kind: 'plain',
        path: [HERO_FIELD, name],
        text: typeof value === 'string' ? cleanHeadingText(value) : '',
        runs: [],
        label: HERO_HEADLINE.label,
        rows: HERO_HEADLINE.rows,
      };
    }
    const twin = RICH_TWINS.heroObject;
    if (name === twin.plain || name === twin.rich) {
      return richTarget(hero, [HERO_FIELD], twin);
    }
    return null;
  }

  const item = sectionByKey(doc, section.array, section.key);
  if (!item) return null;
  const type = typeof item._type === 'string' ? item._type : '';
  const [first, second, third] = section.rest;

  for (const spot of TWIN_LOCATIONS) {
    const twin = RICH_TWINS[spot.owner];
    if (spot.sectionType !== null && spot.sectionType !== type) continue;

    if (spot.under === 'section') {
      if (first === twin.plain || first === twin.rich)
        return richTarget(item, section.itemPath, twin);
      continue;
    }
    if (spot.under === 'header') {
      if (!HEADER_SECTION_TYPES.includes(type)) continue;
      if (first !== 'header') continue;
      if (second !== twin.plain && second !== twin.rich) continue;
      const header = (item.header ?? null) as Record<string, unknown> | null;
      return richTarget(header, [...section.itemPath, 'header'], twin);
    }
    // A row: `sections[k].<array>[_key="r"].body`.
    if (first !== spot.array) continue;
    if (typeof second !== 'object' || second === null || !('_key' in second)) continue;
    if (third !== twin.plain && third !== twin.rich) continue;
    const rows = item[spot.array as string];
    const row = Array.isArray(rows)
      ? ((rows.find((r) => (r as { _key?: string } | null)?._key === second._key) ??
          null) as Record<string, unknown> | null)
      : null;
    return richTarget(row, [...section.itemPath, spot.array as string, second], twin);
  }

  return null;
}

// -----------------------------------------------------------------------------
// What the in-canvas layer offers on a given element
// -----------------------------------------------------------------------------
// The overlay resolver runs SYNCHRONOUSLY, the instant an element is hovered,
// and all it holds is the element's path. That is enough to decide which control
// is even a CANDIDATE. Each control then confirms against the section's real
// `_type` once the document snapshot arrives, and renders nothing if the answer
// is no. Two gates, in that order, because the cheap one runs on every hover and
// the accurate one costs a read.

/** The controls this layer can put on one element. */
export type OverlayControl = 'band' | 'headingAccent' | 'text';

/**
 * Which control a path is a candidate for. An empty list means the element gets
 * nothing and the host's own overlay is left exactly as it was.
 *
 * ONE control per element, on purpose: each renders as an absolutely positioned
 * strip in the same corner of the element's outline, so two would sit on top of
 * each other.
 */
export function overlayControlsForPath(path?: string | null): OverlayControl[] {
  const section = readSectionPath(path, SECTION_ARRAY_FIELDS);

  if (!section) {
    const segments = parseSanityPath(path);
    if (segments.length < 2 || segments[0] !== HERO_FIELD) return [];
    const name = typeof segments[1] === 'string' ? segments[1] : '';
    const twin = RICH_TWINS.heroObject;
    if (name === HERO_HEADLINE.field && segments.length === 2) return ['text'];
    if (name === twin.plain || name === twin.rich) return ['text'];
    return [];
  }

  // NOTE, learned in a deployed Studio (presacademy, 2026-08-28): a BARE
  // array-item path (`sections[_key=="…"]`, nothing after it) gets no control,
  // and cannot. The host builds the resolver context through `getField(node)`
  // and bails when there is no field, and the Studio schema resolves no FIELD
  // for an array item on its own — so the resolver is never called for the
  // section wrapper at all. The first version of that layer put its swatches
  // there and it never mounted.
  //
  // The fix is to give the card a real field to hang on: SectionRenderer.astro
  // renders a small handle inside each band-carrying section in preview,
  // carrying `data-sanity` for `…[_key=="…"].background` (or `.tone`). That IS
  // an object field, so the context builds. The bare-item case is deliberately
  // NOT kept as a fallback: it can never fire, and a branch that can never fire
  // is a branch somebody will one day trust.
  const [first, second, third] = section.rest;
  if (section.rest.length === 1 && (first === 'background' || first === 'tone')) return ['band'];

  // A heading, under either of the two containers that carry an accent.
  if (section.rest.length === 1 && first === HEADING_FIELD) return ['headingAccent'];
  if (section.rest.length === 2 && first === 'header' && second === HEADING_FIELD) {
    return ['headingAccent'];
  }

  // Either half of a rich twin, and any span inside the rich half.
  if (typeof first === 'string' && RICH_TWIN_FIELD_NAMES.has(first)) return ['text'];
  if (first === 'header' && typeof second === 'string' && RICH_TWIN_FIELD_NAMES.has(second)) {
    return ['text'];
  }
  if (
    typeof first === 'string' &&
    ROW_ARRAYS.has(first) &&
    typeof second === 'object' &&
    second !== null &&
    typeof third === 'string' &&
    RICH_TWIN_FIELD_NAMES.has(third)
  ) {
    return ['text'];
  }

  return [];
}

// -----------------------------------------------------------------------------
// A saved section arrives dressed for the page
// -----------------------------------------------------------------------------
// Squarespace's quietest good manners: a band you drop onto a page arrives
// wearing what the page is already wearing, instead of announcing itself in its
// saved colour and making you fix it. A saved section added from the page
// navigator lands at the BOTTOM of the page, so its neighbour is whichever
// section is last right now, and adopting that band means the new section reads
// as a continuation rather than a seam.
//
// ONLY THE BAND TRAVELS. Everything else a preset stores is its own
// composition, and this must never touch it.
//
// The two field names make one extra rule. `ctaSection` offers only navy and
// cream, so a CTA landing under a white or grey band has nothing valid to
// adopt and keeps the tone it was saved with. Writing 'white' into `tone` would
// store a value the schema's radio does not list.

/** Read the band a section wears, resolving nothing. '' when it has none. */
export function sectionBand(section?: Record<string, unknown> | null): string {
  if (!section) return '';
  return storedBand(typeof section._type === 'string' ? section._type : '', section);
}

/**
 * Return a copy of `section` whose band matches `neighbour`.
 *
 * A section type with no band field is returned untouched: giving it a band
 * would write a field its schema does not have.
 */
export function adaptBandToNeighbour<T extends Record<string, unknown>>(
  section: T,
  neighbour?: Record<string, unknown> | null,
): T {
  const field = bandFieldFor(typeof section?._type === 'string' ? section._type : '');
  if (!section || !field) return section;

  const band = sectionBand(neighbour);
  if (band === '') return section;
  if (field === 'tone' && !TONE_VALUES.includes(band)) return section;
  if (section[field] === band) return section;

  return { ...section, [field]: band };
}
