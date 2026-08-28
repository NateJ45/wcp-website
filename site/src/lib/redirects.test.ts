import { describe, it, expect } from 'vitest';
import {
  normalizeRedirectPath,
  isExternalTarget,
  pathForPageSlug,
  pathForPostSlug,
  pathForDocSlug,
  buildRedirectMap,
} from './redirects';

// =============================================================================
// redirects — path normalization + map building
// =============================================================================
// These helpers are shared by the BUILD (astro.config.mjs turns the board's
// `redirect` docs into the Astro redirects map) and the STUDIO (the publish
// action files a redirect automatically when a page slug changes). If the two
// disagreed about what "/old-page/" means, an auto-filed redirect would sit in
// the Studio looking correct and never fire. Hence the tests.
// =============================================================================

describe('normalizeRedirectPath', () => {
  it('adds the leading slash and drops the trailing one', () => {
    expect(normalizeRedirectPath('old-page')).toBe('/old-page');
    expect(normalizeRedirectPath('/old-page/')).toBe('/old-page');
    expect(normalizeRedirectPath('/old-page')).toBe('/old-page');
  });

  it('collapses doubled slashes and trims whitespace', () => {
    expect(normalizeRedirectPath('  /classes//twos/  ')).toBe('/classes/twos');
  });

  it('keeps the root as "/"', () => {
    expect(normalizeRedirectPath('/')).toBe('/');
    expect(normalizeRedirectPath('///')).toBe('/');
  });

  it('drops the query string and fragment (matching is on the path alone)', () => {
    expect(normalizeRedirectPath('/a/b?utm_source=fb#top')).toBe('/a/b');
    expect(normalizeRedirectPath('/?q=1')).toBe('/');
  });

  it('leaves external targets untouched', () => {
    expect(normalizeRedirectPath('https://example.org/x/')).toBe('https://example.org/x/');
    expect(isExternalTarget('http://example.org')).toBe(true);
    expect(isExternalTarget('/enroll')).toBe(false);
  });

  it('returns null for nothing usable', () => {
    expect(normalizeRedirectPath('')).toBeNull();
    expect(normalizeRedirectPath('   ')).toBeNull();
    expect(normalizeRedirectPath(undefined)).toBeNull();
    expect(normalizeRedirectPath(42)).toBeNull();
  });
});

describe('pathForPageSlug / pathForPostSlug', () => {
  it('maps the home slug to the front page', () => {
    expect(pathForPageSlug('home')).toBe('/');
  });

  it('keeps nested slugs whole', () => {
    expect(pathForPageSlug('classes/twos')).toBe('/classes/twos');
    expect(pathForPageSlug('/classes/twos/')).toBe('/classes/twos');
  });

  it('puts posts under /news/', () => {
    expect(pathForPostSlug('spring-open-house')).toBe('/news/spring-open-house');
    expect(pathForPostSlug('/spring-open-house/')).toBe('/news/spring-open-house');
  });

  it('has no path for an empty or non-string slug', () => {
    expect(pathForPageSlug('')).toBeNull();
    expect(pathForPageSlug(null)).toBeNull();
    expect(pathForPostSlug('  ')).toBeNull();
  });

  it('routes by document type and ignores types with no public path', () => {
    expect(pathForDocSlug('page', 'why-wcp')).toBe('/why-wcp');
    expect(pathForDocSlug('post', 'why-wcp')).toBe('/news/why-wcp');
    expect(pathForDocSlug('hubPage', 'documents')).toBeNull();
  });
});

describe('buildRedirectMap', () => {
  it('builds 301s by default and 302s when the board unticks "permanent"', () => {
    expect(buildRedirectMap([{ from: '/a', to: '/b' }])).toEqual({
      '/a': { status: 301, destination: '/b' },
    });
    expect(buildRedirectMap([{ from: '/a', to: '/b', permanent: false }])).toEqual({
      '/a': { status: 302, destination: '/b' },
    });
  });

  it('normalizes both sides so "/a/" and "/a" are one key', () => {
    expect(buildRedirectMap([{ from: '/a/', to: 'b/' }])).toEqual({
      '/a': { status: 301, destination: '/b' },
    });
  });

  it('drops self-redirects, however they were typed', () => {
    expect(buildRedirectMap([{ from: '/a', to: '/a/' }])).toEqual({});
  });

  it('drops half-filled entries and external left-hand sides', () => {
    expect(
      buildRedirectMap([
        { from: '/a' },
        { to: '/b' },
        { from: '', to: '/b' },
        { from: 'https://example.org/a', to: '/b' },
      ]),
    ).toEqual({});
  });

  it('allows an external destination', () => {
    expect(buildRedirectMap([{ from: '/shop', to: 'https://example.org/shop' }])).toEqual({
      '/shop': { status: 301, destination: 'https://example.org/shop' },
    });
  });

  it('lets a later entry win for the same source path', () => {
    expect(
      buildRedirectMap([
        { from: '/a', to: '/old' },
        { from: '/a/', to: '/new' },
      ]),
    ).toEqual({ '/a': { status: 301, destination: '/new' } });
  });
});
