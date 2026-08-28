import { describe, it, expect } from 'vitest';
import {
  checkPage,
  countFindings,
  hasTypedContent,
  internalPaths,
  normalizePath,
  pageUnits,
  sectionLabel,
} from './page-checks';

const img = (ref = 'image-abc-800x600-jpg') => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: ref },
});

const group = (doc: unknown, id: 'alt' | 'empty' | 'links', slugs: string[] = []) =>
  checkPage(doc, slugs).find((g) => g.id === id)!;

describe('sectionLabel', () => {
  it('turns a type name into plain words', () => {
    expect(sectionLabel('splitMediaSection')).toBe('Split media');
    expect(sectionLabel('faqSection')).toBe('Faq');
    expect(sectionLabel('heroObject')).toBe('Hero');
  });
});

describe('pageUnits', () => {
  it('lists the hero then each section, numbered as the Studio numbers them', () => {
    const units = pageUnits({
      hero: { heading: 'Hi' },
      sections: [{ _type: 'proseSection' }, { _type: 'gallerySection' }],
    });
    expect(units.map((u) => u.where)).toEqual([
      'Hero (top banner)',
      'Section 1: Prose',
      'Section 2: Gallery',
    ]);
  });

  it('survives a page with no hero and no sections', () => {
    expect(pageUnits({})).toEqual([]);
    expect(pageUnits(null)).toEqual([]);
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
    expect(checkPage({}).map((g) => g.id)).toEqual(['alt', 'empty', 'links']);
  });

  it('counts nothing for a page that is in good shape', () => {
    const doc = {
      hero: { _type: 'heroObject', heading: 'Welcome', image: img(), imageAlt: 'Our front door' },
      sections: [{ _type: 'ctaSection', heading: 'Book a tour', href: '/visit' }],
    };
    expect(countFindings(checkPage(doc, ['home', 'visit']))).toBe(0);
  });
});
