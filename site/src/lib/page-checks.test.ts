// =============================================================================
// page-checks tests - this repo's Vitest copy of the canonical suite
// =============================================================================
// NOT marked PORTABLE on purpose. src/lib/page-checks.ts is byte-identical to
// the starter's canonical copy, but the TEST FILE is per-runner: the starter
// runs node:test, this repo runs Vitest, and vitest.config.ts globs
// `src/**/*.test.ts`, so the node:test copy cannot simply be dropped in. The
// CASES are the shared thing; the assertions are written in the local runner.
//
// Two config objects are used. WCP's real PAGE_CHECK_CONFIG pins what the
// action actually reports, and a small fixture config covers the seams a
// one-array repo cannot reach (several section arrays, an opt-out header,
// extra setting keys).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  checkPage,
  countFindings,
  hasTypedContent,
  internalPaths,
  normalizePath,
  pageUnits,
  sectionLabel,
  type CheckId,
  type PageCheckConfig,
} from './page-checks';
import { PAGE_CHECK_CONFIG } from '../sanity/pageBuilderConfig';

/** The seams WCP's own shape cannot exercise. */
const FIXTURE: PageCheckConfig = {
  sectionArrays: ['pageBuilder', 'extraSections'],
  header: { label: 'Hero (top banner)', fields: ['hero'], checkEmpty: true },
  selfFillingSections: ['teamSection', 'faqSection'],
  codeOwnedPaths: ['events', 'news', 'og'],
};

const img = (ref = 'image-abc-800x600-jpg') => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: ref },
});

const group = (doc: unknown, id: CheckId, slugs: string[] = []) =>
  checkPage(doc, PAGE_CHECK_CONFIG, slugs).find((g) => g.id === id)!;

describe('sectionLabel', () => {
  it('turns a suffixed type name into plain words', () => {
    expect(sectionLabel('splitMediaSection')).toBe('Split media');
    expect(sectionLabel('faqSection')).toBe('Faq');
    expect(sectionLabel('heroObject')).toBe('Hero');
  });

  it('turns a prefixed type name into the same plain words', () => {
    expect(sectionLabel('sectionImageText')).toBe('Image text');
    expect(sectionLabel('embed')).toBe('Embed');
  });
});

describe('pageUnits', () => {
  it('lists the hero then each section, numbered as the Studio numbers them', () => {
    const units = pageUnits(
      {
        hero: { heading: 'Hi' },
        sections: [{ _type: 'proseSection' }, { _type: 'gallerySection' }],
      },
      PAGE_CHECK_CONFIG,
    );
    expect(units.map((u) => u.where)).toEqual([
      'Hero (top banner)',
      'Section 1: Prose',
      'Section 2: Gallery',
    ]);
  });

  it('survives a page with no hero and no sections', () => {
    expect(pageUnits({}, PAGE_CHECK_CONFIG)).toEqual([]);
    expect(pageUnits(null, PAGE_CHECK_CONFIG)).toEqual([]);
  });

  it('numbers straight on across several section arrays', () => {
    const units = pageUnits(
      { pageBuilder: [{ _type: 'quoteSection' }], extraSections: [{ _type: 'ctaBandSection' }] },
      FIXTURE,
    );
    expect(units.map((u) => u.where)).toEqual(['Section 1: Quote', 'Section 2: Cta band']);
  });

  it('skips the header when none of its fields are present', () => {
    const config: PageCheckConfig = {
      ...FIXTURE,
      header: { label: 'Hero', fields: ['heroTitle'] },
    };
    expect(pageUnits({ pageBuilder: [] }, config)).toEqual([]);
  });
});

describe('alt text check', () => {
  it('flags an image with no description anywhere', () => {
    const found = group(
      { sections: [{ _type: 'gallerySection', photos: [{ image: img() }] }] },
      'alt',
    );
    expect(found.findings).toEqual([
      { where: 'Section 1: Gallery', detail: 'A photo here has no description (alt text).' },
    ]);
  });

  it('accepts all three ways this repo models alt text', () => {
    const doc = {
      // hero: `imageAlt` beside `image`
      hero: { _type: 'heroObject', image: img(), imageAlt: 'Kids at the door' },
      sections: [
        // figureImage: `alt` beside `image`
        {
          _type: 'gallerySection',
          photos: [{ _type: 'figureImage', image: img(), alt: 'A painting table' }],
        },
        // inline: `alt` on the image value itself
        { _type: 'proseSection', body: [{ ...img(), alt: 'The playground' }] },
      ],
    };
    expect(group(doc, 'alt').findings).toEqual([]);
  });

  it('counts several bare photos in one section as one finding', () => {
    const found = group(
      {
        sections: [{ _type: 'gallerySection', photos: [{ image: img('a') }, { image: img('b') }] }],
      },
      'alt',
    );
    expect(found.findings).toHaveLength(1);
    expect(found.findings[0].detail).toContain('2 photos');
  });

  it('does not count whitespace as a description', () => {
    const found = group(
      { sections: [{ _type: 'gallerySection', image: img(), alt: '   ' }] },
      'alt',
    );
    expect(found.findings).toHaveLength(1);
  });
});

describe('empty section check', () => {
  it('flags a section with no words in it', () => {
    const found = group({ sections: [{ _type: 'proseSection', _key: 'k1' }] }, 'empty');
    expect(found.findings).toEqual([
      {
        where: 'Section 1: Prose',
        detail: 'Nothing is typed in this one yet, so it may show up blank.',
      },
    ]);
  });

  it('does not count settings or ids as words', () => {
    const doc = {
      sections: [
        { _type: 'ctaSection', _key: 'k1', variant: 'wide', tone: 'navy', align: 'center' },
      ],
    };
    expect(group(doc, 'empty').findings).toHaveLength(1);
  });

  it('counts words nested deep inside the section', () => {
    const doc = {
      sections: [
        {
          _type: 'proseSection',
          body: [{ _type: 'block', children: [{ _type: 'span', text: 'Welcome!' }] }],
        },
      ],
    };
    expect(group(doc, 'empty').findings).toEqual([]);
  });

  it('skips the sections that fill themselves from a list', () => {
    const doc = { sections: [{ _type: 'teacherSection' }, { _type: 'faqSection' }] };
    expect(group(doc, 'empty').findings).toEqual([]);
  });

  it('checks the hero, because this repo asks it to', () => {
    const doc = { hero: { image: img() } };
    expect(group(doc, 'empty').findings).toHaveLength(1);
  });

  it('leaves the header alone when the config does not ask for it', () => {
    const quiet: PageCheckConfig = { ...FIXTURE, header: { label: 'Hero', fields: ['hero'] } };
    const doc = { hero: { image: img() } };
    expect(checkPage(doc, quiet).find((g) => g.id === 'empty')!.findings).toEqual([]);
  });

  it('honours an extra setting key from the config', () => {
    const doc = { pageBuilder: [{ _type: 'proseSection', flavour: 'chapel' }] };
    const loose = checkPage(doc, FIXTURE).find((g) => g.id === 'empty')!;
    expect(loose.findings).toEqual([]);
    const strict: PageCheckConfig = { ...FIXTURE, extraSettingKeys: ['flavour'] };
    expect(checkPage(doc, strict).find((g) => g.id === 'empty')!.findings).toHaveLength(1);
  });

  it('exposes the same rule on its own', () => {
    expect(hasTypedContent({ _type: 'x', variant: 'a' })).toBe(false);
    expect(hasTypedContent({ heading: 'Hello' })).toBe(true);
  });
});

describe('normalizePath', () => {
  it('keeps same-site paths and drops the rest', () => {
    expect(normalizePath('/about')).toBe('/about');
    expect(normalizePath('/about/?ref=x#top')).toBe('/about');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('https://example.com/about')).toBeNull();
    expect(normalizePath('//example.com')).toBeNull();
    expect(normalizePath('mailto:hi@example.com')).toBeNull();
    expect(normalizePath('#tours')).toBeNull();
  });
});

describe('internalPaths', () => {
  it('finds paths wherever they are written', () => {
    expect(
      internalPaths({ href: '/about', buttons: [{ url: '/visit' }], text: 'not a link' }).sort(),
    ).toEqual(['/about', '/visit']);
  });
});

describe('link check', () => {
  const doc = {
    sections: [
      {
        _type: 'ctaSection',
        heading: 'Come see us',
        buttons: [{ href: '/visit' }, { href: '/nowhere' }],
      },
    ],
  };

  it('flags a path no page owns', () => {
    const found = group(doc, 'links', ['home', 'visit']);
    expect(found.findings).toEqual([
      { where: 'Section 1: Cta', detail: 'Links to /nowhere, and no page seems to live there.' },
    ]);
  });

  it('accepts addresses the site code owns', () => {
    const built = { sections: [{ _type: 'ctaSection', href: '/events/fall-fair', b: '/news' }] };
    expect(group(built, 'links', ['home']).findings).toEqual([]);
  });

  it('matches on the first part, so sub-pages of a real page pass', () => {
    const nested = { sections: [{ _type: 'ctaSection', href: '/classes/twos' }] };
    expect(group(nested, 'links', ['classes']).findings).toEqual([]);
  });

  it('never flags the home page', () => {
    expect(group({ sections: [{ _type: 'ctaSection', href: '/' }] }, 'links', []).findings).toEqual(
      [],
    );
  });

  it('reports one finding per distinct address in a section', () => {
    const twice = { sections: [{ _type: 'ctaSection', a: '/gone', b: '/gone', c: '/also-gone' }] };
    expect(group(twice, 'links', []).findings).toHaveLength(2);
  });
});

describe('checkPage', () => {
  it('always returns the three groups, in order', () => {
    expect(checkPage({}, PAGE_CHECK_CONFIG).map((g) => g.id)).toEqual(['alt', 'empty', 'links']);
  });

  it('counts nothing for a page that is in good shape', () => {
    const doc = {
      hero: { _type: 'heroObject', heading: 'Welcome', image: img(), imageAlt: 'Our front door' },
      sections: [{ _type: 'ctaSection', heading: 'Book a tour', href: '/visit' }],
    };
    expect(countFindings(checkPage(doc, PAGE_CHECK_CONFIG, ['home', 'visit']))).toBe(0);
  });
});
