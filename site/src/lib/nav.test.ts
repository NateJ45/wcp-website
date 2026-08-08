import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveNavigation } from './nav';
import { mainNav as mainNavFallback } from '@/data/nav';

// =============================================================================
// resolveNavigation — the Menus doc → header/footer shapes
// =============================================================================
// The 2026-08 regression this guards: the Menus doc's page links lost their
// `page` references (a patch script wrote literal slugs into a field the
// schema doesn't have), so `"pageSlug": page->slug` resolved null and EVERY
// nav link silently rendered href="/" — the whole public nav sent visitors to
// the home page. The resolver must never fail that quietly again.
// =============================================================================

const pageLink = (label: string, pageSlug: string | null) => ({
  _type: 'navLink',
  label,
  linkType: 'page',
  pageSlug,
});

afterEach(() => vi.restoreAllMocks());

describe('resolveNavigation', () => {
  it('falls back to the code nav when the doc is missing or empty', () => {
    expect(resolveNavigation(null).mainNav).toBe(mainNavFallback);
    expect(resolveNavigation({ mainNav: [] }).mainNav).toBe(mainNavFallback);
  });

  it('resolves page links to their slug and home to /', () => {
    const { mainNav } = resolveNavigation({
      mainNav: [pageLink('Tuition', 'tuition'), pageLink('Home', 'home')],
    });
    expect(mainNav).toEqual([
      { label: 'Tuition', href: '/tuition' },
      { label: 'Home', href: '/' },
    ]);
  });

  it('passes url links through and flags external ones', () => {
    const { mainNav } = resolveNavigation({
      mainNav: [
        { _type: 'navLink', label: 'Store', linkType: 'url', url: 'https://store.example' },
        { _type: 'navLink', label: 'Events', linkType: 'url', url: '/events' },
      ],
    });
    expect(mainNav).toEqual([
      { label: 'Store', href: 'https://store.example', external: true },
      { label: 'Events', href: '/events' },
    ]);
  });

  it('warns loudly when a page link resolves without a slug (dangling reference)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { mainNav } = resolveNavigation({
      mainNav: [pageLink('Tuition', null)],
    });
    // Degrades to "/" so the build still ships, but never silently.
    expect(mainNav).toEqual([{ label: 'Tuition', href: '/' }]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0].join(' ')).toContain('Tuition');
  });

  it('warns for broken links inside groups and footer columns too', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveNavigation({
      mainNav: [{ _type: 'navGroup', label: 'Classes', children: [pageLink('Twos', null)] }],
      footerColumns: [{ label: 'About', links: [pageLink('FAQ', null)] }],
      legalNav: [pageLink('Privacy', null)],
    });
    expect(warn).toHaveBeenCalledTimes(3);
  });
});
