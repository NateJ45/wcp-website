// =============================================================================
// resolve — the DRIFT GATE on Presentation's URL -> document filters
// =============================================================================
// `mainDocuments` in resolve.ts is a set of GROQ filter STRINGS. Nothing
// type-checks a string against the schema, so a filter can name a field path
// that does not exist and fail completely silently: Presentation finds no
// document, shows "Missing a main document for <path>", and the editor panel
// simply stops following the preview. No error, no build failure, no test.
//
// That is exactly what happened. Every `page` filter queried `slug.current`,
// but `page.slug` is a plain STRING (it must hold slashes for nested addresses
// like "classes/twos", which Sanity's slug type cannot), so `.current` was
// always undefined and every page route matched nothing — from the commit that
// introduced the block until 2026-08-29. `post.slug` genuinely IS a slug type,
// so its `.current` is correct; the inconsistency between the two is real and
// is the whole reason this is easy to get wrong.
//
// So this file reads the SCHEMA SOURCE, decides what each document's slug field
// actually is, and fails if a filter disagrees with it.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const RESOLVE = read('./resolve.ts');

/** The declared `type:` of a document's `slug` field, straight from its schema. */
function slugFieldType(schemaFile: string): string {
  const source = read(`./schemaTypes/documents/${schemaFile}`);
  const field = source.match(/name: 'slug',[\s\S]{0,200}?type: '([a-zA-Z]+)'/);
  if (!field) throw new Error(`no slug field found in ${schemaFile}`);
  return field[1];
}

/** Every `filter: '...'` string inside the defineDocuments([...]) block. */
function mainDocumentFilters(): string[] {
  const block = RESOLVE.match(/defineDocuments\(\[([\s\S]*?)\]\)/);
  expect(block, 'defineDocuments([...]) block not found in resolve.ts').toBeTruthy();
  return [...block![1].matchAll(/filter: '([^']+)'/g)].map((m) => m[1]);
}

/** Every `route: '...'` string, in the order Presentation will try them. */
function mainDocumentRoutes(): string[] {
  const block = RESOLVE.match(/defineDocuments\(\[([\s\S]*?)\]\)/);
  return [...block![1].matchAll(/route: '([^']+)'/g)].map((m) => m[1]);
}

describe('the schema still says what these filters assume', () => {
  it('page.slug is a plain string, so its filters must not use .current', () => {
    // If this ever becomes a real slug type, the filters below must gain
    // `.current` in the same commit — and this assertion is what will say so.
    expect(slugFieldType('page.ts')).toBe('string');

    const pageFilters = mainDocumentFilters().filter((f) => f.includes('_type == "page"'));
    expect(pageFilters.length).toBeGreaterThan(0);
    for (const filter of pageFilters) {
      expect(filter, `page filter queries a field that does not exist: ${filter}`).not.toMatch(
        /slug\.current/,
      );
      expect(filter).toMatch(/\bslug\b/);
    }
  });

  it('hubPage.slug is a plain string too', () => {
    expect(slugFieldType('hubPage.ts')).toBe('string');
    for (const filter of mainDocumentFilters().filter((f) => f.includes('_type == "hubPage"'))) {
      expect(filter).not.toMatch(/slug\.current/);
    }
  });

  it('post.slug IS a slug type, so its filter keeps .current', () => {
    // The asymmetry is deliberate, not an oversight. Pinned so nobody
    // "fixes" it to match the page filters.
    expect(slugFieldType('post.ts')).toBe('slug');
    const postFilters = mainDocumentFilters().filter((f) => f.includes('_type == "post"'));
    expect(postFilters.length).toBeGreaterThan(0);
    for (const filter of postFilters) {
      expect(filter).toMatch(/slug\.current/);
    }
  });
});

describe('route order', () => {
  const routes = mainDocumentRoutes();
  const at = (route: string) => routes.indexOf(route);

  it('lists the exact routes this preview surface has', () => {
    expect(routes).toEqual([
      '/preview',
      '/preview/family-hub/:key',
      '/preview/news/:slug',
      '/preview/:parent/:slug',
      '/preview/:slug',
    ]);
  });

  it('puts the specific two-segment routes before the generic one', () => {
    // Presentation takes the FIRST matching route. If the generic
    // /preview/:parent/:slug came first it would swallow /preview/news/x and
    // /preview/family-hub/x, and look for a `page` whose slug is "news/x".
    expect(at('/preview/family-hub/:key')).toBeLessThan(at('/preview/:parent/:slug'));
    expect(at('/preview/news/:slug')).toBeLessThan(at('/preview/:parent/:slug'));
  });

  it('puts the two-segment route before the one-segment catch-all', () => {
    expect(at('/preview/:parent/:slug')).toBeLessThan(at('/preview/:slug'));
  });

  it('handles nested pages generically, not just classes/*', () => {
    // The old route hardcoded "classes", so a nested page anywhere else fell
    // through and matched nothing.
    const nested = mainDocumentFilters().find((f) => f.includes('$parent'));
    expect(nested).toBe('_type == "page" && slug == $parent + "/" + $slug');
    expect(RESOLVE).not.toContain("route: '/preview/classes/:slug'");
  });
});

describe('locations agree with the same schema', () => {
  // The "Used on" panel moved to ./locations.ts on 2026-08-29 and now QUERIES
  // the dataset for real usage. These pin the slug handling there instead.
  const LOCATIONS = read('./locations.ts');

  it('page hrefs treat slug as a plain string', () => {
    expect(LOCATIONS).toMatch(/const previewHref = \(slug\?: string\)/);
    expect(LOCATIONS).toMatch(/typeof row\.slug === 'string' \? previewHref\(row\.slug\)/);
  });

  it('post hrefs read slug.current, the one slug-typed field', () => {
    expect(LOCATIONS).toMatch(/row\.slug\?\.current/);
  });

  it('the usage query excludes drafts and covers the class hop', () => {
    // Published perspective answers "where does this appear on the SITE?";
    // the viaClass arm is how a teacher reaches pages through class->teacher.
    expect(LOCATIONS).toContain('!(_id in path("drafts.**")) && references($id)');
    expect(LOCATIONS).toContain('references(*[_type == "class" && references($id)]._id)');
  });

  it('a class always lists the tuition table, which no reference can see', () => {
    // The table lists every class through a wildcard query, so references()
    // never catches it — a brand-new class would otherwise read "not shown
    // anywhere" while already being in the table. Pinned so the guarantee
    // stays even if the ALWAYS map is refactored.
    expect(LOCATIONS).toMatch(/const ALWAYS[\s\S]*?class:[\s\S]*?href: '\/preview\/tuition'/);
  });

  it('resolve.ts delegates locations to the resolver', () => {
    expect(RESOLVE).toMatch(/import \{ locations \} from '\.\/locations'/);
    expect(RESOLVE).toMatch(/^  locations,$/m);
  });
});
