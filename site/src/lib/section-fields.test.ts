// =============================================================================
// section-fields — the registry, and the DRIFT GATE that keeps it honest
// =============================================================================
// src/lib/section-fields.ts duplicates knowledge that lives in the schema,
// because the preview island cannot ask the Studio which fields a section has.
// The duplication is only safe while something checks it, so the first half of
// this file READS THE SCHEMA SOURCE and fails the build when a section gains or
// loses one of these fields without the registry being updated.
//
// It reads two more sources, because "the section has the field" is not the same
// as "the editor gets what the control promises":
//   - Section.astro, for the exact classes each band paints. The card swaps
//     those classes on the band the instant a colour is clicked.
//   - every section BRIDGE, for whether it actually passes the underlined word
//     through to SectionHeader. `align` on the same object is honoured by only
//     some bridges (see the note in sectionHeader.ts); if `headingAccent` ever
//     goes the same way, the word picker must stop offering it there.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  BAND_BY_VALUE,
  BAND_OPTIONS,
  BAND_SECTION_TYPES,
  HEADER_SECTION_TYPES,
  HEADING_ACCENT_FIELD,
  HEADING_FIELD,
  RICH_TWINS,
  TONE_SECTION_TYPES,
  TONE_VALUES,
  adaptBandToNeighbour,
  bandApplies,
  bandChoicesFor,
  bandFieldFor,
  overlayControlsForPath,
  resolveAccentTarget,
  resolveTextTarget,
  sectionBand,
  storedBand,
} from './section-fields';

// Sanity's stega payload is a run of invisible characters appended to the
// string, exactly as src/lib/emphasis.test.ts models it.
const STEGA_TAIL = '​‌‍﻿​‌';
const encoded = (text: string) => text + STEGA_TAIL;

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const SECTIONS_DIR = fileURLToPath(new URL('../sanity/schemaTypes/sections/', import.meta.url));
const SHARED = read('../sanity/schemaTypes/objects/_shared.ts');
const SECTION_HEADER = read('../sanity/schemaTypes/objects/sectionHeader.ts');
const ICON_CARD = read('../sanity/schemaTypes/objects/iconCard.ts');
const SECTION_ASTRO = read('../components/Section.astro');
const RENDERER = read('../components/sections/SectionRenderer.astro');

/** One `export const x = defineType({…})` block, as the schema knows it. */
interface TypeBody {
  /** The schema `name`, which is the stored `_type`. */
  name: string;
  /** The source of the whole block. */
  body: string;
  /** The file it came from, for a readable failure. */
  file: string;
}

/** Split a schema source file into its declared types, in file order. */
function typeBodies(source: string, file: string): TypeBody[] {
  const starts = [...source.matchAll(/^export const (\w+) = defineType\(\{$/gm)];
  return starts
    .map((match, i) => {
      const from = match.index ?? 0;
      const to = i + 1 < starts.length ? (starts[i + 1].index ?? source.length) : source.length;
      const body = source.slice(from, to);
      return { name: body.match(/\n {2}name: '([^']+)',/)?.[1] ?? '', body, file };
    })
    .filter((entry) => entry.name !== '');
}

/** Every section type the page builder registers, in schema order. */
const SECTION_TYPES: TypeBody[] = readdirSync(SECTIONS_DIR)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .flatMap((f) => typeBodies(readFileSync(SECTIONS_DIR + f, 'utf8'), f));

// =============================================================================
// The drift gate
// =============================================================================

describe('the drift gate parsed the schema at all', () => {
  it('found the section types', () => {
    expect(SECTION_TYPES.length).toBeGreaterThan(35);
    expect(SECTION_TYPES.map((t) => t.name)).toContain('ctaSection');
    expect(SECTION_TYPES.map((t) => t.name)).toContain('heroObject');
  });
});

describe('the band field', () => {
  it('BAND_SECTION_TYPES matches every type calling bandFields()', () => {
    const actual = SECTION_TYPES.filter((t) => t.body.includes('bandFields(')).map((t) => t.name);
    expect([...BAND_SECTION_TYPES].sort()).toEqual(actual.sort());
  });

  it('TONE_SECTION_TYPES matches every section type declaring its own `tone`', () => {
    const actual = SECTION_TYPES.filter((t) => t.body.includes("name: 'tone',")).map((t) => t.name);
    expect([...TONE_SECTION_TYPES].sort()).toEqual(actual.sort());
    expect(actual).toEqual(['ctaSection']);
  });

  it('statBandSection is deliberately absent: its band is a renderer fallback, not a field', () => {
    // StatBandSection.astro READS `section.background` so the renderer's
    // navy-adjacency pass can write one back. A volunteer has no such field, so
    // this layer must not pretend one exists.
    const statBand = SECTION_TYPES.find((t) => t.name === 'statBandSection');
    expect(statBand?.body.includes('bandFields(')).toBe(false);
    expect(bandFieldFor('statBandSection')).toBeNull();
    expect(read('../components/sections/StatBandSection.astro')).toContain('section.background');
  });

  it('BAND_OPTIONS carries the schema’s own values, in the schema’s own order', () => {
    const list = SHARED.slice(SHARED.indexOf('export const BACKGROUND_OPTIONS'));
    const values = [...list.matchAll(/value: '(\w+)'/g)].slice(0, 4).map((m) => m[1]);
    expect(BAND_OPTIONS.map((b) => b.value)).toEqual(values);
  });

  it('TONE_VALUES carries ctaSection’s two, in its own order', () => {
    const cta = SECTION_TYPES.find((t) => t.name === 'ctaSection')?.body ?? '';
    const at = cta.indexOf("name: 'tone',");
    const values = [...cta.slice(at).matchAll(/value: '(\w+)'/g)].slice(0, 2).map((m) => m[1]);
    expect([...TONE_VALUES]).toEqual(values);
    expect(bandChoicesFor('ctaSection').map((b) => b.value)).toEqual(values);
  });

  it('every band’s className is EXACTLY what Section.astro paints', () => {
    // The card removes one class list and adds another so the band recolours
    // under the cursor. A className that has drifted would silently refuse the
    // swap (applyClasses bails when the band is not wearing what it expected).
    const map = SECTION_ASTRO.slice(
      SECTION_ASTRO.indexOf('const bgClasses'),
      SECTION_ASTRO.indexOf('const pad ='),
    );
    for (const band of BAND_OPTIONS) {
      const painted = map.match(new RegExp(`\\n  ${band.value}: '([^']+)',`))?.[1];
      expect(painted, `Section.astro has no class list for '${band.value}'`).toBeTruthy();
      expect(band.className).toBe(painted);
    }
  });
});

describe('the underlined word', () => {
  it('headingAccent is declared in exactly two places, both beside a `title`', () => {
    const declaring = [
      { name: 'sectionHeader', body: SECTION_HEADER },
      ...SECTION_TYPES.filter((t) => t.body.includes(`name: '${HEADING_ACCENT_FIELD}',`)),
    ].filter((entry) => entry.body.includes(`name: '${HEADING_ACCENT_FIELD}',`));

    expect(declaring.map((d) => d.name).sort()).toEqual(['ctaSection', 'sectionHeader']);
    for (const entry of declaring) {
      const at = entry.body.indexOf(`name: '${HEADING_ACCENT_FIELD}',`);
      const before = [...entry.body.slice(0, at).matchAll(/name: '(\w+)',/g)].map((m) => m[1]);
      expect(before[before.length - 1], `${entry.name}: the field before the accent`).toBe(
        HEADING_FIELD,
      );
    }
  });

  it('HEADER_SECTION_TYPES matches every type carrying a sectionHeader', () => {
    const actual = SECTION_TYPES.filter((t) => t.body.includes("type: 'sectionHeader'")).map(
      (t) => t.name,
    );
    expect([...HEADER_SECTION_TYPES].sort()).toEqual(actual.sort());
  });

  it('every one of those bridges actually PASSES the accent to SectionHeader', () => {
    // The honesty gate. `align` on the same object is dropped by most bridges;
    // the day a bridge drops `headingAccent` too, the picker must stop offering
    // it there rather than store a word nothing underlines.
    const map = RENDERER.slice(RENDERER.indexOf('const MAP'), RENDERER.indexOf('---\n\n{'));
    const components = new Map(
      [...map.matchAll(/^ {2}(\w+): (\w+),$/gm)].map((m) => [m[1], m[2]] as const),
    );
    for (const type of HEADER_SECTION_TYPES) {
      const component = components.get(type);
      expect(component, `SectionRenderer has no component for ${type}`).toBeTruthy();
      const source = read(`../components/sections/${component}.astro`);
      expect(source, `${component}.astro drops headingAccent`).toContain(HEADING_ACCENT_FIELD);
    }
  });

  it('the CTA banner passes its own accent through too', () => {
    expect(read('../components/sections/CtaSection.astro')).toContain(
      `accentWord={section.${HEADING_ACCENT_FIELD}`,
    );
  });
});

describe('the rich twins', () => {
  /** Owner -> twin field, read straight out of the schema sources. */
  const parsed: Record<string, { owner: string; plain: string; rich: string }> = {};
  for (const entry of [
    { name: 'sectionHeader', body: SECTION_HEADER, file: 'sectionHeader.ts' },
    { name: 'iconCard', body: ICON_CARD, file: 'iconCard.ts' },
    ...SECTION_TYPES,
  ]) {
    for (const match of entry.body.matchAll(/richTwin\('(\w+)'/g)) {
      const at = match.index ?? 0;
      // The owner is the nearest array member opened before this twin, when one
      // names itself; otherwise the type the twin sits directly on.
      const members = [
        ...entry.body
          .slice(0, at)
          .matchAll(/defineArrayMember\(\{\s*\n?\s*type: 'object',\s*\n?\s*name: '(\w+)'/g),
      ];
      const owner = members.length ? members[members.length - 1][1] : entry.name;
      const rich = match[1];
      parsed[owner] = { owner, plain: rich.replace(/Rich$/, ''), rich };
    }
  }

  it('found seven of them, and no more', () => {
    expect(Object.keys(parsed).length).toBe(7);
  });

  it('RICH_TWINS names the same seven owners and the same field pairs', () => {
    const registry = Object.fromEntries(
      Object.values(RICH_TWINS).map((t) => [
        t.owner,
        { owner: t.owner, plain: t.plain, rich: t.rich },
      ]),
    );
    expect(registry).toEqual(parsed);
  });

  it('every twin is named <field>Rich and every plain half hides behind it', () => {
    const sources = [SECTION_HEADER, ICON_CARD, ...SECTION_TYPES.map((t) => t.body)].join('\n');
    for (const twin of Object.values(RICH_TWINS)) {
      expect(twin.rich, `${twin.owner}`).toBe(`${twin.plain}Rich`);
      expect(sources).toContain(`name: '${twin.plain}',`);
      expect(sources, `${twin.owner}: '${twin.plain}' does not hide`).toContain(
        `hiddenWhenRich('${twin.rich}')`,
      );
    }
  });
});

describe('the in-canvas handle in SectionRenderer', () => {
  // The handle is the only reason the band card can mount at all, and it is the
  // only markup this card adds to a rendered page. Two promises are worth a
  // gate: it is PREVIEW ONLY (page-parity.mjs proves the live HTML is
  // unchanged, but only for the pages it compares), and there is EXACTLY ONE
  // per section, only for sections that have a band to change.
  it('is computed once, rendered once, and gated on editDoc plus the registry', () => {
    expect([...RENDERER.matchAll(/const handleAttr =/g)]).toHaveLength(1);
    expect([...RENDERER.matchAll(/data-sanity=\{handleAttr\}/g)]).toHaveLength(1);
    const gate = RENDERER.slice(
      RENDERER.indexOf('const handleAttr ='),
      RENDERER.indexOf('sectionFieldEditAttr(editDoc'),
    );
    expect(gate).toContain('editAttr &&');
    expect(gate).toContain('bandApplies(section._type, section)');
  });
});

// =============================================================================
// The lookups
// =============================================================================

describe('bandFieldFor and bandChoicesFor', () => {
  it('names the field each type actually carries', () => {
    expect(bandFieldFor('proseSection')).toBe('background');
    expect(bandFieldFor('ctaSection')).toBe('tone');
    expect(bandFieldFor('noticeBarSection')).toBeNull();
    expect(bandFieldFor('statBandSection')).toBeNull();
    expect(bandFieldFor(undefined)).toBeNull();
    expect(bandFieldFor(null)).toBeNull();
  });

  it('offers all four bands, or the CTA’s two, or none', () => {
    expect(bandChoicesFor('proseSection').map((b) => b.value)).toEqual([
      'white',
      'grey',
      'cream',
      'navy',
    ]);
    expect(bandChoicesFor('ctaSection').map((b) => b.value)).toEqual(['navy', 'cream']);
    expect(bandChoicesFor('noticeBarSection')).toEqual([]);
  });

  it('BAND_BY_VALUE reaches every option', () => {
    for (const band of BAND_OPTIONS) expect(BAND_BY_VALUE[band.value]).toBe(band);
  });
});

describe('bandApplies — the per-instance gate', () => {
  const filled = {
    _type: 'proseSection',
    _key: 'a',
    body: [{ _type: 'block', children: [{ text: 'Hi' }] }],
  };

  it('says yes to a section that has a band AND something in it', () => {
    expect(bandApplies('proseSection', filled)).toBe(true);
  });

  it('says NO to an empty section, which renders as the coaching note, not a band', () => {
    // SectionCoach is a plain <div> with no <section> and no band classes, so a
    // colour offered there could not be applied to anything.
    expect(bandApplies('proseSection', { _type: 'proseSection', _key: 'a' })).toBe(false);
  });

  it('says no to a type with no band field, however full it is', () => {
    expect(
      bandApplies('statBandSection', { _type: 'statBandSection', _key: 'a', stats: [{}] }),
    ).toBe(false);
    expect(
      bandApplies('noticeBarSection', { _type: 'noticeBarSection', _key: 'a', text: 'x' }),
    ).toBe(false);
  });

  it('says no when there is no section to check', () => {
    expect(bandApplies('proseSection', null)).toBe(false);
  });
});

describe('storedBand', () => {
  it('reads whichever field the type uses', () => {
    expect(storedBand('proseSection', { background: 'cream' })).toBe('cream');
    expect(storedBand('ctaSection', { tone: 'navy' })).toBe('navy');
    // The CTA's band is `tone`; a stray `background` on it is not the band.
    expect(storedBand('ctaSection', { background: 'grey' })).toBe('');
    expect(storedBand('proseSection', {})).toBe('');
    expect(storedBand('noticeBarSection', { background: 'grey' })).toBe('');
  });

  it('cleans a stega-encoded value rather than returning one', () => {
    expect(storedBand('proseSection', { background: encoded('cream') })).toBe('cream');
  });
});

// =============================================================================
// What the layer offers, from a path alone
// =============================================================================

describe('overlayControlsForPath', () => {
  it('gives the band card to the handle, which names a real FIELD', () => {
    expect(overlayControlsForPath('sections[_key=="k"].background')).toEqual(['band']);
    expect(overlayControlsForPath('sections[_key=="k"].tone')).toEqual(['band']);
  });

  it('gives a BARE array-item path nothing, because a control cannot mount there', () => {
    expect(overlayControlsForPath('sections[_key=="k"]')).toEqual([]);
  });

  it('gives a heading the word picker, under either of its two containers', () => {
    expect(overlayControlsForPath('sections[_key=="k"].header.title')).toEqual(['headingAccent']);
    expect(overlayControlsForPath('sections[_key=="k"].title')).toEqual(['headingAccent']);
  });

  it('gives either half of a rich twin the text card', () => {
    expect(overlayControlsForPath('sections[_key=="k"].header.lead')).toEqual(['text']);
    expect(overlayControlsForPath('sections[_key=="k"].header.leadRich')).toEqual(['text']);
    expect(overlayControlsForPath('sections[_key=="k"].lead')).toEqual(['text']);
    expect(overlayControlsForPath('sections[_key=="k"].intro')).toEqual(['text']);
    expect(overlayControlsForPath('sections[_key=="k"].cards[_key=="c"].body')).toEqual(['text']);
    expect(overlayControlsForPath('sections[_key=="k"].steps[_key=="s"].bodyRich')).toEqual([
      'text',
    ]);
    expect(overlayControlsForPath('sections[_key=="k"].rows[_key=="r"].body')).toEqual(['text']);
  });

  it('gives a span INSIDE a rich twin the same card', () => {
    expect(
      overlayControlsForPath(
        'sections[_key=="k"].rows[_key=="r"].bodyRich[_key=="b"].children[_key=="c"].text',
      ),
    ).toEqual(['text']);
  });

  it('gives the hero’s headline and intro the text card, and nothing else on the document', () => {
    expect(overlayControlsForPath('hero.title')).toEqual(['text']);
    expect(overlayControlsForPath('hero.lead')).toEqual(['text']);
    expect(overlayControlsForPath('hero.leadRich')).toEqual(['text']);
    expect(overlayControlsForPath('hero.eyebrow')).toEqual([]);
    expect(overlayControlsForPath('hero.accentWord')).toEqual([]);
    expect(overlayControlsForPath('title')).toEqual([]);
    expect(overlayControlsForPath('hero')).toEqual([]);
  });

  it('leaves everything else to the host overlay', () => {
    expect(overlayControlsForPath('sections[_key=="k"].header.eyebrow')).toEqual([]);
    expect(overlayControlsForPath('sections[_key=="k"].background.tone')).toEqual([]);
    expect(overlayControlsForPath('sections[_key=="k"].cards[_key=="c"].title')).toEqual([]);
    expect(overlayControlsForPath('mainNav[_key=="n"].label')).toEqual([]);
    expect(overlayControlsForPath('')).toEqual([]);
    expect(overlayControlsForPath(undefined)).toEqual([]);
  });

  it('never offers two controls on one element, which would stack them', () => {
    const paths = [
      'sections[_key=="k"].background',
      'sections[_key=="k"].header.title',
      'sections[_key=="k"].header.lead',
      'hero.title',
    ];
    for (const path of paths) expect(overlayControlsForPath(path)).toHaveLength(1);
  });
});

// =============================================================================
// What a control is pointed at, once the document has answered
// =============================================================================

const DOC = {
  hero: { title: 'Where kids belong', lead: 'Two mornings a week.', accentWord: 'belong' },
  sections: [
    {
      _key: 'a',
      _type: 'ctaSection',
      title: 'Come and see us',
      headingAccent: 'see',
      lead: 'We would love to meet you.',
    },
    {
      _key: 'b',
      _type: 'cardGridSection',
      header: { title: 'What a morning looks like', lead: 'A quick tour.' },
      cards: [
        {
          _key: 'c1',
          body: 'Ignored once the twin has text.',
          bodyRich: [
            {
              _type: 'block',
              children: [
                { _type: 'span', text: 'Sixteen mornings, ', marks: [] },
                { _type: 'span', text: 'in person', marks: ['em'] },
              ],
            },
          ],
        },
      ],
    },
    { _key: 'c', _type: 'statBandSection', stats: [{ value: '55', label: 'years' }] },
  ],
};

describe('resolveAccentTarget', () => {
  it('points a CTA headline at the accent beside it', () => {
    expect(resolveAccentTarget(DOC, 'sections[_key=="a"].title')).toEqual({
      headingPath: ['sections', { _key: 'a' }, 'title'],
      accentPath: ['sections', { _key: 'a' }, 'headingAccent'],
    });
  });

  it('points a section heading at the accent INSIDE its header', () => {
    expect(resolveAccentTarget(DOC, 'sections[_key=="b"].header.title')).toEqual({
      headingPath: ['sections', { _key: 'b' }, 'header', 'title'],
      accentPath: ['sections', { _key: 'b' }, 'header', 'headingAccent'],
    });
  });

  it('refuses a heading on a type that carries no accent', () => {
    expect(resolveAccentTarget(DOC, 'sections[_key=="c"].header.title')).toBeNull();
    // A cardGridSection's own `title` is not its heading; the header holds that.
    expect(resolveAccentTarget(DOC, 'sections[_key=="b"].title')).toBeNull();
    expect(resolveAccentTarget(DOC, 'sections[_key=="zz"].title')).toBeNull();
    expect(resolveAccentTarget(DOC, 'hero.title')).toBeNull();
  });
});

describe('resolveTextTarget', () => {
  it('opens the hero headline as a plain textarea, seeded with itself', () => {
    expect(resolveTextTarget(DOC, 'hero.title')).toEqual({
      kind: 'plain',
      path: ['hero', 'title'],
      text: 'Where kids belong',
      runs: [],
      label: 'Headline',
      rows: 2,
    });
  });

  it('seeds an EMPTY twin from the plain string it falls back to', () => {
    const target = resolveTextTarget(DOC, 'sections[_key=="a"].lead');
    expect(target?.kind).toBe('rich');
    expect(target?.path).toEqual(['sections', { _key: 'a' }, 'leadRich']);
    expect(target?.runs).toEqual([
      { text: 'We would love to meet you.', strong: false, em: false },
    ]);
    expect(target?.label).toBe('Intro line');
  });

  it('seeds a FILLED twin from the twin, marks and all', () => {
    const target = resolveTextTarget(DOC, 'sections[_key=="b"].cards[_key=="c1"].bodyRich');
    expect(target?.path).toEqual(['sections', { _key: 'b' }, 'cards', { _key: 'c1' }, 'bodyRich']);
    expect(target?.runs).toEqual([
      { text: 'Sixteen mornings, ', strong: false, em: false },
      { text: 'in person', strong: false, em: true },
    ]);
    expect(target?.label).toBe('Text');
  });

  it('opens the same twin whether the click landed on a span or on the field', () => {
    expect(
      resolveTextTarget(
        DOC,
        'sections[_key=="b"].cards[_key=="c1"].bodyRich[_key=="x"].children[_key=="y"].text',
      ),
    ).toEqual(resolveTextTarget(DOC, 'sections[_key=="b"].cards[_key=="c1"].bodyRich'));
  });

  it('resolves the header twin through the header object', () => {
    const target = resolveTextTarget(DOC, 'sections[_key=="b"].header.lead');
    expect(target?.path).toEqual(['sections', { _key: 'b' }, 'header', 'leadRich']);
    expect(target?.runs).toEqual([{ text: 'A quick tour.', strong: false, em: false }]);
  });

  it('resolves the hero twin', () => {
    const target = resolveTextTarget(DOC, 'hero.lead');
    expect(target?.path).toEqual(['hero', 'leadRich']);
    expect(target?.runs).toEqual([{ text: 'Two mornings a week.', strong: false, em: false }]);
  });

  it('resolves to nothing where there is no twin', () => {
    expect(resolveTextTarget(DOC, 'sections[_key=="c"].intro')).toBeNull();
    expect(resolveTextTarget(DOC, 'sections[_key=="a"].title')).toBeNull();
    expect(resolveTextTarget(DOC, 'sections[_key=="zz"].lead')).toBeNull();
    expect(resolveTextTarget(DOC, 'hero.eyebrow')).toBeNull();
    // A card body on a type whose cards are not iconCards.
    expect(resolveTextTarget(DOC, 'sections[_key=="c"].cards[_key=="x"].body')).toBeNull();
  });

  it('never lets a stega payload into the box', () => {
    const doc = { hero: { title: encoded('Where kids belong') } };
    expect(resolveTextTarget(doc, 'hero.title')?.text).toBe('Where kids belong');
  });
});

// =============================================================================
// A saved section arrives dressed for the page
// =============================================================================

describe('adaptBandToNeighbour', () => {
  it('a new section adopts the band of the one it lands under', () => {
    expect(
      adaptBandToNeighbour(
        { _type: 'cardGridSection', background: 'white' },
        { _type: 'proseSection', background: 'cream' },
      ),
    ).toEqual({ _type: 'cardGridSection', background: 'cream' });
  });

  it('reads the neighbour’s band under WHICHEVER name that neighbour uses', () => {
    expect(
      adaptBandToNeighbour(
        { _type: 'cardGridSection', background: 'white' },
        { _type: 'ctaSection', tone: 'navy' },
      ),
    ).toEqual({ _type: 'cardGridSection', background: 'navy' });
  });

  it('writes the band under WHICHEVER name the new section uses', () => {
    expect(
      adaptBandToNeighbour(
        { _type: 'ctaSection', tone: 'navy' },
        { _type: 'proseSection', background: 'cream' },
      ),
    ).toEqual({ _type: 'ctaSection', tone: 'cream' });
  });

  it('leaves a CTA alone rather than storing a tone its radio does not list', () => {
    const cta = { _type: 'ctaSection', tone: 'navy' };
    expect(adaptBandToNeighbour(cta, { _type: 'proseSection', background: 'grey' })).toBe(cta);
    expect(adaptBandToNeighbour(cta, { _type: 'proseSection', background: 'white' })).toBe(cta);
  });

  it('leaves a section with no band field completely alone', () => {
    const stats = { _type: 'statBandSection', stats: [] };
    expect(adaptBandToNeighbour(stats, { _type: 'proseSection', background: 'navy' })).toBe(stats);
  });

  it('changes nothing when there is no neighbour, or it stores no band', () => {
    const section = { _type: 'cardGridSection', background: 'cream' };
    expect(adaptBandToNeighbour(section, null)).toBe(section);
    expect(adaptBandToNeighbour(section, undefined)).toBe(section);
    expect(adaptBandToNeighbour(section, { _type: 'statBandSection' })).toBe(section);
  });

  it('only the band travels; everything else the preset saved is its own', () => {
    expect(
      adaptBandToNeighbour(
        { _type: 'cardGridSection', background: 'white', columns: 4, layout: 'compactIcon' },
        { _type: 'proseSection', background: 'navy', narrow: true },
      ),
    ).toEqual({ _type: 'cardGridSection', background: 'navy', columns: 4, layout: 'compactIcon' });
  });

  it('never mutates its inputs', () => {
    const section = { _type: 'cardGridSection', background: 'white' };
    const neighbour = { _type: 'proseSection', background: 'navy' };
    adaptBandToNeighbour(section, neighbour);
    expect(section).toEqual({ _type: 'cardGridSection', background: 'white' });
    expect(neighbour).toEqual({ _type: 'proseSection', background: 'navy' });
  });
});

describe('sectionBand', () => {
  it('reads a band without being told the type twice', () => {
    expect(sectionBand({ _type: 'ctaSection', tone: 'cream' })).toBe('cream');
    expect(sectionBand({ _type: 'proseSection', background: 'grey' })).toBe('grey');
    expect(sectionBand({ _type: 'proseSection' })).toBe('');
    expect(sectionBand(null)).toBe('');
  });
});
