// =============================================================================
// undo & redo tests - this repo's Vitest copy of the canonical suite
// =============================================================================
// NOT marked PORTABLE on purpose. src/sanity/undoRedo.ts is byte-identical to
// the starter's canonical copy, but the TEST FILE is per-runner: the starter
// runs node:test, this repo runs Vitest, and vitest.config.ts globs
// `src/**/*.test.ts`, so the node:test copy cannot simply be dropped in. The
// CASES are the shared thing; the assertions are written in the local runner.
// Same arrangement as page-checks.test.ts (PORTS.md cards 23 and 25).
//
// The 41 cases below are the canonical ones, in the canonical order. Read
// src/sanity/undoRedo.ts's header first: it explains the transaction log, the
// rev guard, why `_rev` must be stripped before applyPatch, and the two rules
// the empty-revert postmortem produced.
// =============================================================================
import { describe, it, expect } from 'vitest';
import type { SanityClient } from '@sanity/client';
import {
  changesSomething,
  documentBefore,
  effectFor,
  fetchLastTransactions,
  isNoOpEffect,
  isRevInSync,
  parseTransactions,
  pickUndoTarget,
  publishedIdOf,
  redoDepth,
  redoLast,
  resetUndoRedo,
  sameIgnoringVolatile,
  transactionsTouching,
  translogRequest,
  undoLast,
  withoutRev,
  type TranslogTransaction,
} from '../sanity/undoRedo';

const DRAFT = 'drafts.homePage';

/**
 * A whole-value mendoza patch. `[0, value]` is a literal: opcode 0 replaces the
 * document with `value`. These are genuine mendoza and go through the real
 * applyPatch, so the plumbing is exercised for real.
 *
 * The EMPTY patch `[]` is the one that matters most here. It is what a real
 * create transaction carries as its `revert`, and `applyPatch(doc, [])` returns
 * the document UNCHANGED rather than null - the trap this file shipped with.
 */
const literal = (value: unknown) => [0, value] as never;
const EMPTY = [] as never;

const tx = (id: string, docId: string, before: unknown, after: unknown): TranslogTransaction => ({
  id,
  timestamp: '2026-08-28T12:00:00Z',
  documentIDs: [docId],
  effects: { [docId]: { apply: literal(after), revert: literal(before) } },
});

/** A create, shaped the way the API really shapes one: revert is EMPTY. */
const createTx = (id: string, docId: string, value: unknown): TranslogTransaction => ({
  id,
  documentIDs: [docId],
  effects: { [docId]: { apply: literal(value), revert: EMPTY } },
});

/** A transaction that listed the document but changed nothing about it. */
const noOpTx = (id: string, docId: string): TranslogTransaction => ({
  id,
  documentIDs: [docId],
  effects: { [docId]: { apply: EMPTY, revert: EMPTY } },
});

// -----------------------------------------------------------------------------
// The request shape
// -----------------------------------------------------------------------------

describe('translogRequest', () => {
  it('asks the history API the way sanity itself does', () => {
    const req = translogRequest('production', DRAFT, 5);
    expect(req.method).toBe('GET');
    expect(req.url).toBe('/data/history/production/transactions/drafts.homePage');
    expect(req.query.effectFormat).toBe('mendoza');
    expect(req.query.reverse).toBe('true');
    expect(req.query.limit).toBe('5');
    expect(req.tag).toBeTruthy();
  });

  it('keeps excludeContent true (the API 403s otherwise)', () => {
    // Verified against a live dataset: excludeContent=false answers 403 "This
    // API requires excludeContent to be true". Effects come back regardless, so
    // nothing is lost and this must never be flipped.
    expect(translogRequest('production', DRAFT).query.excludeContent).toBe('true');
  });

  it('escapes the document id', () => {
    expect(translogRequest('production', 'drafts.a b').url).toMatch(/drafts\.a%20b$/);
  });
});

// -----------------------------------------------------------------------------
// NDJSON parsing
// -----------------------------------------------------------------------------

describe('parseTransactions', () => {
  it('reads NDJSON, blank lines and CRLF included', () => {
    expect(parseTransactions('{"id":"a"}\r\n\r\n{"id":"b"}\n').map((t) => t.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('accepts an already-parsed array or single object', () => {
    expect(parseTransactions([{ id: 'a' }, { id: 'b' }]).map((t) => t.id)).toEqual(['a', 'b']);
    expect(parseTransactions({ id: 'a' }).map((t) => t.id)).toEqual(['a']);
  });

  it('treats an empty body as no transactions', () => {
    expect(parseTransactions('')).toEqual([]);
    expect(parseTransactions(undefined)).toEqual([]);
  });

  it('throws on an error line rather than reading it as silence', () => {
    expect(() =>
      parseTransactions('{"error":{"description":"This API requires excludeContent to be true"}}'),
    ).toThrow(/excludeContent/);
  });
});

// -----------------------------------------------------------------------------
// Reading absence out of the patch shape (the bug that shipped)
// -----------------------------------------------------------------------------

describe('documentBefore', () => {
  it('reads a CREATE from the empty revert, not from applyPatch', () => {
    // THE REGRESSION, at its root. A create transaction carries `revert: []`,
    // and `applyPatch(doc, [])` hands the document straight back. Anything that
    // tests applyPatch's result for null concludes "it was already like this"
    // and writes the document back to itself.
    const current = { _id: DRAFT, _type: 'homePage', _rev: 'r1', title: 'made by a chip' };
    expect(documentBefore(current, { apply: literal(current), revert: EMPTY })).toEqual({
      absent: true,
    });
  });

  it('restores the previous document for an ordinary change', () => {
    const current = { _id: DRAFT, _type: 'homePage', _rev: 'r2', title: 'after' };
    const before = { _id: DRAFT, _type: 'homePage', title: 'before' };
    const result = documentBefore(current, { apply: literal(current), revert: literal(before) });
    expect(result.absent).toBe(false);
    expect(result.absent === false && result.doc).toEqual(before);
  });

  it('still honours an explicit null literal', () => {
    const current = { _id: DRAFT, _type: 'homePage', _rev: 'r1' };
    expect(documentBefore(current, { apply: EMPTY, revert: literal(null) })).toEqual({
      absent: true,
    });
  });

  it('isNoOpEffect spots a transaction that named the document but changed nothing', () => {
    // Real: seen on drafts.homePage in the live log, both patches empty.
    expect(isNoOpEffect({ apply: EMPTY, revert: EMPTY })).toBe(true);
    expect(isNoOpEffect({ apply: literal({}), revert: EMPTY })).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// "An undo that changes nothing is not an undo"
// -----------------------------------------------------------------------------

describe('the honesty rule', () => {
  it('sameIgnoringVolatile ignores _rev and _updatedAt and nothing else', () => {
    const a = { _rev: 'r1', _updatedAt: 'then', title: 'T', body: { n: [1, 2] } };
    const b = { _rev: 'r2', _updatedAt: 'now', title: 'T', body: { n: [1, 2] } };
    expect(sameIgnoringVolatile(a, b)).toBe(true);
    expect(sameIgnoringVolatile(a, { ...b, title: 'other' })).toBe(false);
    expect(sameIgnoringVolatile(a, { ...b, body: { n: [1, 3] } })).toBe(false);
    expect(sameIgnoringVolatile(a, { ...b, extra: 1 })).toBe(false);
  });

  it('sameIgnoringVolatile compares arrays by length and order', () => {
    expect(sameIgnoringVolatile([1, 2], [1, 2])).toBe(true);
    expect(sameIgnoringVolatile([1, 2], [2, 1])).toBe(false);
    expect(sameIgnoringVolatile([1, 2], [1, 2, 3])).toBe(false);
    expect(sameIgnoringVolatile([{ a: 1 }], [{ a: 1 }])).toBe(true);
  });

  it('changesSomething says no when only a server-owned field would move', () => {
    const current = { _id: DRAFT, _type: 'homePage', _rev: 'r2', _updatedAt: 'now', title: 'T' };
    expect(
      changesSomething(current, {
        absent: false,
        doc: { ...withoutRev(current), _updatedAt: 'then' },
      }),
    ).toBe(false);
    expect(
      changesSomething(current, { absent: false, doc: { ...withoutRev(current), title: 'X' } }),
    ).toBe(true);
    // Deleting is always a change.
    expect(changesSomething(current, { absent: true })).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Picking the step to undo
// -----------------------------------------------------------------------------

const doc = (title: string, rev = 'r1') => ({ _id: DRAFT, _type: 'homePage', _rev: rev, title });

describe('picking the step to undo', () => {
  it('effectFor ignores a transaction that did not touch this document', () => {
    expect(effectFor(tx('t1', 'drafts.other', {}, {}), DRAFT)).toBeNull();
  });

  it('effectFor rejects a malformed effect', () => {
    const bad = {
      id: 't1',
      effects: { [DRAFT]: { apply: 'nope' } },
    } as unknown as TranslogTransaction;
    expect(effectFor(bad, DRAFT)).toBeNull();
  });

  it('transactionsTouching keeps only this document, newest first', () => {
    const txs = [
      tx('t3', DRAFT, {}, {}),
      tx('t2', 'drafts.other', {}, {}),
      tx('t1', DRAFT, {}, {}),
    ];
    expect(transactionsTouching(txs, DRAFT).map((t) => t.id)).toEqual(['t3', 't1']);
  });

  it('pickUndoTarget skips our own writes and the steps already undone', () => {
    const current = doc('three');
    const txs = [
      tx('ours-1', DRAFT, doc('two'), current),
      tx('t3', DRAFT, doc('one'), doc('two')),
      tx('t2', DRAFT, doc('zero'), doc('one')),
    ];
    const ours = new Set(['ours-1']);
    expect(pickUndoTarget(txs, DRAFT, current, ours, new Set())?.tx.id).toBe('t3');
    expect(pickUndoTarget(txs, DRAFT, current, ours, new Set(['t3']))?.tx.id).toBe('t2');
    expect(pickUndoTarget(txs, DRAFT, current, ours, new Set(['t3', 't2']))).toBeNull();
  });

  it('pickUndoTarget skips a no-op transaction and takes the real one behind it', () => {
    const current = doc('after');
    const txs = [noOpTx('noop', DRAFT), tx('real', DRAFT, doc('before'), current)];
    expect(pickUndoTarget(txs, DRAFT, current, new Set(), new Set())?.tx.id).toBe('real');
  });

  it('pickUndoTarget skips a transaction that would put back the same document', () => {
    // The deployed failure in miniature: transactions that moved nothing but
    // `_updatedAt`, each of which the old code happily reported as "undone".
    const current = { ...doc('same'), _updatedAt: 'now' };
    const stale = { ...withoutRev(current), _updatedAt: 'then' };
    const txs = [
      tx('noop-1', DRAFT, stale, current),
      tx('noop-2', DRAFT, stale, current),
      tx('real', DRAFT, { ...withoutRev(current), title: 'different' }, current),
    ];
    expect(pickUndoTarget(txs, DRAFT, current, new Set(), new Set())?.tx.id).toBe('real');
  });

  it('pickUndoTarget returns the create when that is the only real step back', () => {
    const current = doc('made by a chip');
    const target = pickUndoTarget(
      [createTx('c1', DRAFT, current)],
      DRAFT,
      current,
      new Set(),
      new Set(),
    );
    expect(target?.tx.id).toBe('c1');
    expect(target?.previous).toEqual({ absent: true });
  });

  it('isRevInSync is the rev guard: newest transaction id must be the doc _rev', () => {
    const txs = [tx('t2', DRAFT, {}, {}), tx('t1', DRAFT, {}, {})];
    expect(isRevInSync(txs, DRAFT, 't2')).toBe(true);
    // Someone wrote after the log we read.
    expect(isRevInSync(txs, DRAFT, 't1')).toBe(false);
    expect(isRevInSync(txs, DRAFT, undefined)).toBe(false);
    expect(isRevInSync([], DRAFT, 't2')).toBe(false);
  });

  it('withoutRev drops _rev and nothing else', () => {
    expect(withoutRev({ _id: 'x', _rev: 'r', title: 'T' })).toEqual({ _id: 'x', title: 'T' });
  });

  it('publishedIdOf finds the twin, and leaves a published id alone', () => {
    expect(publishedIdOf('drafts.homePage')).toBe('homePage');
    expect(publishedIdOf('homePage')).toBe('homePage');
  });
});

// -----------------------------------------------------------------------------
// A miniature Sanity, faithful in the three ways that bit us
// -----------------------------------------------------------------------------
// The first version of this fake got all three wrong, which is exactly why the
// suite was green while the deployed Studio lied:
//
//   1. A CREATE writes `revert: []`, not a null literal.
//   2. `_updatedAt` moves on every write, so writing an identical document
//      still produces a real transaction with a real effect.
//   3. A caller-supplied `transactionId` is IGNORED, exactly as
//      @sanity/client's `_create` ignores it. The server assigns its own.

interface Doc extends Record<string, unknown> {
  _id: string;
  _type: string;
  _rev?: string;
  _updatedAt?: string;
}

function fakeSanity(initial: Record<string, Doc | undefined> = {}) {
  const docs = new Map<string, Doc>();
  const log: TranslogTransaction[] = [];
  let counter = 0;

  function write(id: string, next: Doc | undefined) {
    const txId = `srv${++counter}`;
    const before = docs.get(id);
    const stamp = `2026-08-28T00:00:${String(counter).padStart(2, '0')}Z`;
    if (next) docs.set(id, { ...next, _rev: txId, _updatedAt: stamp });
    else docs.delete(id);
    const after = docs.get(id);
    log.unshift({
      id: txId,
      documentIDs: [id],
      effects: {
        [id]: {
          // A create has no previous value, and the API says so with an EMPTY
          // revert patch. A delete says the same thing with an empty apply.
          apply: after ? literal(withoutRev(after)) : EMPTY,
          revert: before ? literal(withoutRev(before)) : EMPTY,
        },
      },
    });
    return txId;
  }

  for (const [id, d] of Object.entries(initial)) if (d) write(id, d);

  const client = {
    config: () => ({ dataset: 'production' }),
    getDocument: async (id: string) => docs.get(id),
    request: async () => log.map((t) => JSON.stringify(t)).join('\n'),
    createOrReplace: async (d: Doc, opts?: { returnDocuments?: boolean }) => {
      const transactionId = write(d._id, d);
      return opts?.returnDocuments === false ? { transactionId } : docs.get(d._id);
    },
    delete: async (id: string, opts?: { returnDocuments?: boolean }) => {
      const transactionId = write(id, undefined);
      return opts?.returnDocuments === false ? { transactionId } : undefined;
    },
  };

  return {
    client: client as unknown as SanityClient,
    docs,
    log,
    /** Somebody else's mutation lands on the document. */
    edit: (id: string, patch: Partial<Doc>) => write(id, { ...(docs.get(id) as Doc), ...patch }),
    create: (id: string, d: Doc) => write(id, d),
  };
}

const page = (title: string, extra: Record<string, unknown> = {}): Doc => ({
  _id: DRAFT,
  _type: 'homePage',
  title,
  ...extra,
});

// -----------------------------------------------------------------------------
// The deployed failure, as tests
// -----------------------------------------------------------------------------

describe('the regression', () => {
  it('undoing an overlay-created draft removes it instead of rewriting it', async () => {
    // presacademy, 2026-08-28: a Presentation overlay chip created
    // drafts.pricingPage and set a tone in ONE transaction. Ctrl+Z toasted
    // "Change undone" three times and the tone never moved, because the
    // create's empty revert was read as "no change" and the document was
    // written back to itself.
    resetUndoRedo();
    const sanity = fakeSanity({ homePage: { _id: 'homePage', _type: 'homePage', title: 'live' } });
    sanity.create(DRAFT, page('created by a chip', { background: { tone: 'chapel' } }));
    const transactionsBefore = sanity.log.length;

    const result = await undoLast(sanity.client, DRAFT);

    expect(result.ok).toBe(true);
    expect(result.ok && result.removedDraft).toBe(true);
    // The draft is gone, not rewritten.
    expect(sanity.docs.has(DRAFT)).toBe(false);
    // The published copy is untouched.
    expect(sanity.docs.get('homePage')?.title).toBe('live');
    // Exactly one transaction was written.
    expect(sanity.log.length).toBe(transactionsBefore + 1);
  });

  it('undo never reports success without changing the document', async () => {
    // The honesty rule. Whatever the log holds, a successful undo must have
    // moved something other than a server-owned field.
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('the only copy'));
    // Three writes of the identical document: what the broken build left behind
    // on the live dataset, three transactions that moved only `_updatedAt`.
    for (let i = 0; i < 3; i += 1) sanity.edit(DRAFT, {});

    const before = JSON.stringify(sanity.docs.get(DRAFT));
    const result = await undoLast(sanity.client, DRAFT);

    // No published twin, and nothing else is a real step back.
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('only-copy');
    // And nothing was written.
    expect(JSON.stringify(sanity.docs.get(DRAFT))).toBe(before);
  });

  it('undo walks past no-op transactions to the last real change', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });
    sanity.edit(DRAFT, {}); // identical write, moves only _updatedAt
    sanity.edit(DRAFT, {}); // and another

    expect((await undoLast(sanity.client, DRAFT)).ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');
  });

  it('undo recognises its own writes by the id the SERVER assigned', async () => {
    // The other half of the deployed bug: @sanity/client's `_create` never
    // forwards a caller's transactionId, so tracking the REQUESTED id
    // recognised nothing and multi-step undo could not work. The fake ignores
    // requested ids for the same reason.
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });
    await undoLast(sanity.client, DRAFT);

    // Our undo is the newest transaction.
    expect(sanity.docs.get(DRAFT)?._rev).toBe(sanity.log[0].id);
    // If it were not recognised, this second undo would put 'two' straight back.
    await undoLast(sanity.client, DRAFT);
    expect(sanity.docs.get(DRAFT)?.title).not.toBe('two');
  });
});

// -----------------------------------------------------------------------------
// Undo
// -----------------------------------------------------------------------------

describe('undo', () => {
  it('steps back one change, and a second undo steps back again', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });
    sanity.edit(DRAFT, { title: 'three' });

    expect((await undoLast(sanity.client, DRAFT)).ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('two');

    // The second undo must go FURTHER back, not put 'three' back. Reading the
    // newest transaction naively would oscillate between two states forever.
    expect((await undoLast(sanity.client, DRAFT)).ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');
    expect(redoDepth(DRAFT)).toBe(2);
  });

  it('refuses when the document has moved since the log was read', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.docs.set(DRAFT, { ...(sanity.docs.get(DRAFT) as Doc), _rev: 'somebody-else' });

    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'stale' });
  });

  it('has nothing to do on a document with no draft', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'nothing' });
  });

  it('undoing the change that created the draft removes the draft, twin permitting', async () => {
    resetUndoRedo();
    const sanity = fakeSanity({ homePage: { _id: 'homePage', _type: 'homePage', title: 'live' } });
    sanity.create(DRAFT, page('a draft of it'));

    const result = await undoLast(sanity.client, DRAFT);
    expect(result.ok && result.removedDraft).toBe(true);
    expect(sanity.docs.has(DRAFT)).toBe(false);
    expect(sanity.docs.get('homePage')?.title).toBe('live');
  });

  it('refuses to remove the only copy of a document', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('the only copy'));

    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'only-copy' });
    expect(sanity.docs.get(DRAFT)?.title).toBe('the only copy');
  });

  it('runs out honestly once every step has been taken', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });
    expect((await undoLast(sanity.client, DRAFT)).ok).toBe(true);
    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'only-copy' });
  });
});

// -----------------------------------------------------------------------------
// Redo
// -----------------------------------------------------------------------------

describe('redo', () => {
  it('puts back exactly what the undo took away', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });

    await undoLast(sanity.client, DRAFT);
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');

    expect((await redoLast(sanity.client, DRAFT)).ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('two');
    expect(redoDepth(DRAFT)).toBe(0);
  });

  it('redo, undo, redo walks the same path twice', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });

    await undoLast(sanity.client, DRAFT);
    await redoLast(sanity.client, DRAFT);
    await undoLast(sanity.client, DRAFT);
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');
    await redoLast(sanity.client, DRAFT);
    expect(sanity.docs.get(DRAFT)?.title).toBe('two');
  });

  it('restores a draft the undo removed', async () => {
    resetUndoRedo();
    const sanity = fakeSanity({ homePage: { _id: 'homePage', _type: 'homePage', title: 'live' } });
    sanity.create(DRAFT, page('a draft of it'));

    await undoLast(sanity.client, DRAFT);
    expect(sanity.docs.has(DRAFT)).toBe(false);

    expect((await redoLast(sanity.client, DRAFT)).ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('a draft of it');
  });

  it('an edit after an undo throws the redo away', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });

    await undoLast(sanity.client, DRAFT);
    expect(redoDepth(DRAFT)).toBe(1);

    sanity.edit(DRAFT, { title: 'one and a bit' });
    expect(await redoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'nothing' });
    expect(redoDepth(DRAFT)).toBe(0);
    // And nothing was written.
    expect(sanity.docs.get(DRAFT)?.title).toBe('one and a bit');
  });

  it('undo after an outside edit starts again from the newest change', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });
    await undoLast(sanity.client, DRAFT);
    sanity.edit(DRAFT, { title: 'three' });

    expect((await undoLast(sanity.client, DRAFT)).ok).toBe(true);
    // The newest change, undone.
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');
  });

  it('has nothing to do before anything has been undone', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    expect(await redoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'nothing' });
  });
});

describe('fetchLastTransactions', () => {
  it('returns the log newest first', async () => {
    const sanity = fakeSanity();
    sanity.create(DRAFT, page('one'));
    sanity.edit(DRAFT, { title: 'two' });
    const txs = await fetchLastTransactions(sanity.client, DRAFT);
    expect(txs.length).toBe(2);
    expect(txs[0].id).toBe(sanity.docs.get(DRAFT)?._rev);
  });
});
