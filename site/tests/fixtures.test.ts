import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// The test fixtures must stay obviously fake
// =============================================================================
// site/.gitignore ignores `directory.json` and `teacher-phones.json` at ANY
// depth, because that is what the migration scripts write and those files hold
// every enrolled family's children, phone numbers and home addresses. This repo
// is public.
//
// The two fixtures under tests/fixtures/ are negated back in so the hub suite
// has something to seed local KV with. That negation is a hole in a rule whose
// entire purpose is preventing a PII leak, and the realistic way it gets
// exploited is nobody attacking it at all: someone debugging a failing test
// pastes a slice of the real directory in "just to reproduce it", and the
// commit sails through because the path is exempt.
//
// So the exemption is conditional on the content. Anything that looks like a
// real address, phone number or email address fails the build.
//
// The allowed shapes are the reserved ones, which cannot belong to anyone:
//   - example.invalid — .invalid is reserved by RFC 6761 and can never resolve
//   - 555-01xx        — the block reserved for fiction
// =============================================================================

const FIXTURES = ['tests/fixtures/directory.json', 'tests/fixtures/teacher-phones.json'];

/** An email on any domain that is not a reserved, unresolvable one. */
const REAL_EMAIL = /[\w.+-]+@(?!example\.(invalid|com|org|net)\b)[\w-]+\.[a-z]{2,}/gi;

/**
 * A 10-digit US number whose last four are NOT in the 555-01xx fiction block.
 * Matches 555-0100 style too, so the negative lookahead does the real work.
 */
const REAL_PHONE = /\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const FICTION_PHONE = /^(?:\+?1[\s.-]?)?\(?555\)?[\s.-]?01\d{2}$/;

/** A street address with a real-looking suffix. The fixtures use invented ones. */
const REAL_STREET =
  /\b\d+\s+[A-Z][\w'-]*(?:\s+[A-Z][\w'-]*)*\s+(Road|Rd|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Circle|Cir|Terrace|Ter|Pike|Highway|Hwy)\b/g;

describe('test fixtures', () => {
  for (const relative of FIXTURES) {
    describe(relative, () => {
      const source = readFileSync(join(process.cwd(), relative), 'utf8');

      it('contains no real-looking email addresses', () => {
        expect([...source.matchAll(REAL_EMAIL)].map((m) => m[0])).toEqual([]);
      });

      it('contains no phone numbers outside the 555-01xx fiction block', () => {
        const suspicious = [...source.matchAll(REAL_PHONE)]
          .map((m) => m[0])
          .filter((n) => !FICTION_PHONE.test(n.trim()));
        expect(suspicious).toEqual([]);
      });

      it('contains no real-looking street addresses', () => {
        expect([...source.matchAll(REAL_STREET)].map((m) => m[0])).toEqual([]);
      });

      it('is valid JSON', () => {
        expect(() => JSON.parse(source)).not.toThrow();
      });
    });
  }

  // The shape hub-hints.spec.ts depends on. directory.astro only renders the
  // class filter nav when more than one class is present, and the Directory
  // hint anchors to that nav — so a fixture with one class makes a real test
  // fail for a reason that has nothing to do with the code. It did, on
  // 2026-09-07, and cost an hour of looking for a bug in the hint script.
  it('the directory fixture spans more than one class among opted-in families', () => {
    const doc = JSON.parse(readFileSync(join(process.cwd(), FIXTURES[0]), 'utf8'));
    const classes = new Set(
      (doc.entries ?? [])
        .filter((entry: { optedIn?: boolean }) => entry.optedIn)
        .flatMap((entry: { children?: { class?: string }[] }) =>
          (entry.children ?? []).map((child) => child.class),
        )
        .filter(Boolean),
    );
    expect(
      [...classes].length,
      'the directory would not render its class filter, and the Directory hint has nothing to anchor to',
    ).toBeGreaterThan(1);
  });
});
