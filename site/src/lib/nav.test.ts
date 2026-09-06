import { describe, it, expect, vi, afterEach } from 'vitest';
import { groupChildren, resolveNavigation } from './nav';
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

  // The header button overrides. Rule: an untouched Menus doc must render the
  // header the code already renders, so every absent value means "no change".
  it('shows the header button and overrides nothing by default', () => {
    for (const doc of [null, { mainNav: [] }, { mainNav: [pageLink('Tuition', 'tuition')] }]) {
      expect(resolveNavigation(doc).headerCta).toEqual({ show: true });
    }
  });

  it('reads the header button overrides the Board set', () => {
    const { headerCta } = resolveNavigation({
      mainNav: [pageLink('Tuition', 'tuition')],
      headerCta: { show: false, label: 'Come and see us', linkType: 'page', pageSlug: 'enroll' },
    });
    expect(headerCta).toEqual({ show: false, label: 'Come and see us', href: '/enroll' });
  });

  it('keeps the code link when the header button names no destination', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { headerCta } = resolveNavigation({
      mainNav: [pageLink('Tuition', 'tuition')],
      headerCta: { show: true, label: '  ', linkType: 'page' },
    });
    // No href and no label, so Header.astro keeps both of its own values —
    // and a half-filled object never warns about a dangling reference.
    expect(headerCta).toEqual({ show: true });
    expect(warn).not.toHaveBeenCalled();
  });

  // Archiving a page takes it off the site. A menu item still pointing at it
  // would send visitors to a page that was never built.
  it('drops menu links to archived pages, and keeps every other link', () => {
    const archived = { ...pageLink('Old Camp', 'old-camp'), pageArchived: true };
    const { mainNav, footerNav, legalNav } = resolveNavigation({
      mainNav: [
        pageLink('Tuition', 'tuition'),
        archived,
        { _type: 'navGroup', label: 'Classes', children: [pageLink('Twos', 'twos'), archived] },
        { _type: 'navGroup', label: 'Gone', children: [archived] },
      ],
      footerColumns: [{ label: 'About', links: [pageLink('FAQ', 'faq'), archived] }],
      legalNav: [pageLink('Privacy', 'privacy'), archived],
    });
    expect(mainNav).toEqual([
      { label: 'Tuition', href: '/tuition' },
      { label: 'Classes', children: [{ label: 'Twos', href: '/twos' }] },
    ]);
    expect(footerNav).toEqual([{ label: 'About', children: [{ label: 'FAQ', href: '/faq' }] }]);
    expect(legalNav).toEqual([{ label: 'Privacy', href: '/privacy' }]);
  });

  it('keeps links to pages made before the archive field existed', () => {
    const { mainNav } = resolveNavigation({ mainNav: [pageLink('Tuition', 'tuition')] });
    expect(mainNav).toEqual([{ label: 'Tuition', href: '/tuition' }]);
  });

  it('drops the header button link when its page is archived', () => {
    const { headerCta } = resolveNavigation({
      mainNav: [pageLink('Tuition', 'tuition')],
      headerCta: { show: true, linkType: 'page', pageSlug: 'old-camp', pageArchived: true },
    });
    expect(headerCta).toEqual({ show: true });
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

// ---------------------------------------------------------------------------
// The self-maintaining Classes dropdown (2026-08-29)
// ---------------------------------------------------------------------------
describe('groupChildren', () => {
  const auto = [
    { label: 'Twos Class', linkType: 'page' as const, pageSlug: 'classes/twos' },
    { label: 'Threes Class', linkType: 'page' as const, pageSlug: 'classes/threes' },
    // Pre-K AM and PM share ONE page, so the query yields the same page twice.
    { label: 'Pre-K Class', linkType: 'page' as const, pageSlug: 'classes/pre-k' },
    { label: 'Pre-K Class', linkType: 'page' as const, pageSlug: 'classes/pre-k' },
  ];
  const extra = { label: 'A Day at WCP', linkType: 'page' as const, pageSlug: 'a-day-at-wcp' };

  it('is a pass-through when the toggle is off', () => {
    expect(groupChildren({ children: [extra] })).toEqual([extra]);
    expect(groupChildren({ autoClasses: false, autoChildren: auto, children: [extra] })).toEqual([
      extra,
    ]);
  });

  it('puts the class links first and the hand-written ones after', () => {
    const merged = groupChildren({ autoClasses: true, autoChildren: auto, children: [extra] });
    expect(merged.map((l) => l.label)).toEqual([
      'Twos Class',
      'Threes Class',
      'Pre-K Class',
      'A Day at WCP',
    ]);
  });

  it('collapses two classes sharing one page into a single link', () => {
    const merged = groupChildren({ autoClasses: true, autoChildren: auto, children: [] });
    expect(merged.filter((l) => l.pageSlug === 'classes/pre-k')).toHaveLength(1);
  });

  it('skips a hand-written link the automatic list already covers', () => {
    const dupe = { label: 'Twos (old link)', linkType: 'page' as const, pageSlug: 'classes/twos' };
    const merged = groupChildren({ autoClasses: true, autoChildren: auto, children: [dupe] });
    expect(merged.filter((l) => l.pageSlug === 'classes/twos')).toHaveLength(1);
    expect(merged[0]?.label).toBe('Twos Class');
  });

  it('survives a class list with no pages at all', () => {
    expect(groupChildren({ autoClasses: true, autoChildren: [], children: [extra] })).toEqual([
      extra,
    ]);
  });
});
