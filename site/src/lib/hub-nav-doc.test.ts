import { describe, it, expect } from 'vitest';
import {
  resolveHubNav,
  HUB_ACCENTS,
  BUILTIN_HUB_LINKS,
  type HubNavDoc,
  type NavDocLink,
} from './hub-nav-doc';
import { hubNav } from '@/data/hub-nav';
import { buildClassrooms } from '@/lib/hub-classrooms';

const builtin = (target: string, over: Partial<NavDocLink> = {}): NavDocLink => ({
  _type: 'builtinLink',
  target,
  ...over,
});
const pageLink = (slug: string, title = 'Playground Committee'): NavDocLink => ({
  _type: 'pageLink',
  page: { title, slug, navIcon: 'trees' },
});

const doc = (groups: HubNavDoc['groups']): HubNavDoc => ({ groups });

describe('BUILTIN_HUB_LINKS', () => {
  it('offers every committed link except Home and the self-filling classes', () => {
    const committed = hubNav
      .slice(1)
      .filter((g) => !g.autoClasses)
      .flatMap((g) => g.links);
    expect(BUILTIN_HUB_LINKS).toHaveLength(committed.length);
    expect(BUILTIN_HUB_LINKS.map((l) => l.href)).not.toContain('/family-hub');
  });

  it('leaves the class pages out — that section fills itself', () => {
    // Listing them would invite a Board to hand-pin a link that a class rename
    // leaves stale. Turning the section on is the supported way.
    const classHrefs = hubNav
      .slice(1)
      .filter((g) => g.autoClasses)
      .flatMap((g) => g.links.map((l) => l.href));
    expect(classHrefs.length).toBeGreaterThan(0);
    for (const href of classHrefs) {
      expect(BUILTIN_HUB_LINKS.map((l) => l.href)).not.toContain(href);
    }
  });

  it('still RESOLVES a class link saved before the section became self-filling', () => {
    // A stored builtinLink row pointing at a class page must keep working;
    // dropping it would silently empty a Board-edited menu section.
    const href = hubNav.slice(1).find((g) => g.autoClasses)!.links[0].href;
    const nav = resolveHubNav(doc([{ label: 'Classes', links: [builtin(href)] }]));
    expect(nav[1].links.map((l) => l.href)).toEqual([href]);
  });
});

describe('resolveHubNav', () => {
  it('falls back to the committed menu with no document', () => {
    expect(resolveHubNav(null)).toEqual(hubNav);
    expect(resolveHubNav(undefined)).toEqual(hubNav);
    expect(resolveHubNav({})).toEqual(hubNav);
    expect(resolveHubNav(doc([]))).toEqual(hubNav);
  });

  it('always pins the committed Home group first', () => {
    // A menu edit can rearrange the hub; it can never orphan the front door.
    const out = resolveHubNav(
      doc([{ label: 'Only Group', accent: 'green', links: [builtin('/family-hub/tuition')] }]),
    );
    expect(out[0]).toEqual(hubNav[0]);
    expect(out[1].label).toBe('Only Group');
  });

  it('lets the Board rename a group and reorder everything — the point', () => {
    const out = resolveHubNav(
      doc([
        {
          label: 'Committees',
          accent: 'orange',
          links: [pageLink('playground-committee'), builtin('/family-hub/coop-jobs')],
        },
        {
          label: 'Money',
          accent: 'green',
          links: [builtin('/family-hub/fundraising'), builtin('/family-hub/tuition')],
        },
      ]),
    );
    expect(out.slice(1).map((g) => g.label)).toEqual(['Committees', 'Money']);
    expect(out[1].links.map((l) => l.href)).toEqual([
      '/family-hub/playground-committee',
      '/family-hub/coop-jobs',
    ]);
    // Fundraising now sorts ABOVE tuition because the Board said so.
    expect(out[2].links.map((l) => l.href)).toEqual([
      '/family-hub/fundraising',
      '/family-hub/tuition',
    ]);
  });

  it('relabels a built-in link without touching its target or icon', () => {
    const out = resolveHubNav(
      doc([
        {
          label: 'Money',
          accent: 'green',
          links: [builtin('/family-hub/tuition', { label: 'Tuition & Paying' })],
        },
      ]),
    );
    const link = out[1].links[0];
    expect(link.label).toBe('Tuition & Paying');
    expect(link.href).toBe('/family-hub/tuition');
    expect(link.icon).toBe('circle-dollar-sign'); // committed icon carried through
  });

  it('keeps the class links’ own colours through a rearrangement', () => {
    const out = resolveHubNav(
      doc([
        {
          label: 'Rooms',
          accent: 'sky',
          links: [builtin('/family-hub/twos-threes'), builtin('/family-hub/pre-k')],
        },
      ]),
    );
    // iconColor is part of the committed link definition (class brand colours).
    expect(out[1].links[0].iconColor).toBeTruthy();
  });

  it('hides a built-in link without deleting its row', () => {
    const out = resolveHubNav(
      doc([
        {
          label: 'Money',
          accent: 'green',
          links: [
            builtin('/family-hub/tuition', { hidden: true }),
            builtin('/family-hub/fundraising'),
          ],
        },
      ]),
    );
    expect(out[1].links.map((l) => l.href)).toEqual(['/family-hub/fundraising']);
  });

  it('drops a built-in target that no longer exists rather than render a dead link', () => {
    const out = resolveHubNav(
      doc([
        {
          label: 'Old',
          accent: 'sky',
          links: [builtin('/family-hub/route-removed-in-2031'), builtin('/family-hub/tuition')],
        },
      ]),
    );
    expect(out[1].links.map((l) => l.href)).toEqual(['/family-hub/tuition']);
  });

  it('links a Board page by its reference, labelled from the page itself', () => {
    const out = resolveHubNav(
      doc([{ label: 'Committees', accent: 'orange', links: [pageLink('playground-committee')] }]),
    );
    expect(out[1].links[0]).toEqual({
      label: 'Playground Committee',
      href: '/family-hub/playground-committee',
      icon: 'trees',
    });
  });

  it('drops a page link whose reference dereferenced to nothing', () => {
    // Deleted page, draft-only page, or a slug that is no longer usable: the
    // menu heals itself instead of serving a 404.
    const out = resolveHubNav(
      doc([
        {
          label: 'Committees',
          accent: 'orange',
          links: [
            { _type: 'pageLink', page: null },
            { _type: 'pageLink', page: { title: 'x', slug: 'calendar' } }, // reserved
            pageLink('real-page'),
          ],
        },
      ]),
    );
    expect(out[1].links.map((l) => l.href)).toEqual(['/family-hub/real-page']);
  });

  it('supports external links, marked external', () => {
    const out = resolveHubNav(
      doc([
        {
          label: 'Community',
          accent: 'orange',
          links: [
            {
              _type: 'externalLink',
              label: 'Store',
              url: 'https://store.example.org/',
              icon: 'shopping-bag',
            },
          ],
        },
      ]),
    );
    expect(out[1].links[0]).toMatchObject({ href: 'https://store.example.org/', external: true });
  });

  it('drops an external link missing its label or address', () => {
    const out = resolveHubNav(
      doc([
        {
          label: 'Community',
          accent: 'orange',
          links: [
            { _type: 'externalLink', label: '', url: 'https://x.example/' },
            { _type: 'externalLink', label: 'No address' },
            builtin('/family-hub/directory'),
          ],
        },
      ]),
    );
    expect(out[1].links).toHaveLength(1);
  });

  it('resolves accents from the fixed AA-checked set, falling back to sky', () => {
    const out = resolveHubNav(
      doc([
        { label: 'Green', accent: 'green', links: [builtin('/family-hub/tuition')] },
        { label: 'Typo', accent: 'hotpink', links: [builtin('/family-hub/directory')] },
        { label: 'Unset', links: [builtin('/family-hub/updates')] },
      ]),
    );
    expect(out[1].accent).toBe(HUB_ACCENTS.green);
    expect(out[2].accent).toBe(HUB_ACCENTS.sky); // never an unreadable invention
    expect(out[3].accent).toBe(HUB_ACCENTS.sky);
  });

  it('drops a group with no surviving links, and one with no label', () => {
    const out = resolveHubNav(
      doc([
        { label: 'Empty', accent: 'sky', links: [] },
        {
          label: 'All hidden',
          accent: 'sky',
          links: [builtin('/family-hub/tuition', { hidden: true })],
        },
        { label: '', accent: 'sky', links: [builtin('/family-hub/updates')] },
        { label: 'Survives', accent: 'sky', links: [builtin('/family-hub/health')] },
      ]),
    );
    expect(out.slice(1).map((g) => g.label)).toEqual(['Survives']);
  });

  it('falls back to the committed menu when every group dissolves', () => {
    // A doc that exists but yields nothing (all rows broken) must not render a
    // rail with only Home on it.
    const out = resolveHubNav(
      doc([{ label: 'Ghost', accent: 'sky', links: [{ _type: 'pageLink', page: null }] }]),
    );
    expect(out).toEqual(hubNav);
  });

  it('handles a decade-scale menu without dropping or duplicating', () => {
    const groups = Array.from({ length: 12 }, (_, gi) => ({
      label: `Group ${gi}`,
      accent: (['sky', 'amber', 'green', 'orange'] as const)[gi % 4],
      links: Array.from({ length: 8 }, (_, li) => pageLink(`page-${gi}-${li}`, `Page ${gi}.${li}`)),
    }));
    const out = resolveHubNav(doc(groups));
    expect(out).toHaveLength(13); // Home + 12
    const hrefs = out.slice(1).flatMap((g) => g.links.map((l) => l.href));
    expect(hrefs).toHaveLength(96);
    expect(new Set(hrefs).size).toBe(96);
  });
});

describe('the self-filling Classes section', () => {
  // Two classes that share a page (Twos + Threes) are ONE link, because they
  // are one page; a class on its own page gets its own link.
  const rooms = buildClassrooms(
    [
      { slug: 'twos', name: 'Twos', icon: 'blocks', color: 'amber' },
      { slug: 'threes', name: 'Threes', icon: 'sprout', color: 'green' },
      { slug: 'summer', name: 'Summer', icon: 'sun', color: 'navy' },
    ],
    [{ key: 'twos-threes', classSlugs: ['twos', 'threes'], heading: 'Twos & Threes Classroom' }],
  );

  it('fills the committed menu from the classrooms', () => {
    const nav = resolveHubNav(null, rooms);
    const classes = nav.find((g) => g.autoClasses)!;
    expect(classes.links.map((l) => l.href)).toEqual([
      '/family-hub/twos-threes',
      '/family-hub/summer',
    ]);
    expect(classes.links[0].label).toBe('Twos & Threes Classroom');
  });

  it('fills a Board-edited section that has the switch on', () => {
    const nav = resolveHubNav(doc([{ label: 'Our rooms', autoClasses: true, links: [] }]), rooms);
    expect(nav[1].label).toBe('Our rooms');
    expect(nav[1].links).toHaveLength(2);
  });

  it('leaves the committed links alone when there are no classrooms', () => {
    // A failed gated read must not empty the rail of its class pages.
    const nav = resolveHubNav(null, []);
    expect(nav).toEqual(hubNav);
  });

  it('gives a navy class a sky rail accent, never navy on navy', () => {
    const nav = resolveHubNav(null, rooms);
    const summer = nav.find((g) => g.autoClasses)!.links[1];
    expect(summer.iconColor).toBe('#7dd3fc');
  });
});
