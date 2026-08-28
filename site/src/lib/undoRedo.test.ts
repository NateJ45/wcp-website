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
// The 27 cases below are the canonical ones, in the canonical order. Read
// src/sanity/undoRedo.ts's header first: it explains the transaction log, the
// rev guard, and why `_rev` must be stripped before applyPatch.
// =============================================================================
import { describe, it, expect } from 'vitest';
import type { SanityClient } from '@sanity/client';
import {
  effectFor,
  fetchLastTransactions,
  isRevInSync,
  nextUndoTarget,
  parseTransactions,
  publishedIdOf,
  redoDepth,
  redoLast,
  resetUndoRedo,
  transactionsTouching,
  translogRequest,
  undoLast,
  withoutRev,
  type TranslogTransaction,
} from '../sanity/undoRedo';

const DRAFT = 'drafts.homePage';

/**
 * A whole-value mendoza patch. `[0, value]` is a literal: mendoza's opcode 0
 * replaces the document with `value`, and `[0, null]` deletes it. Real patches
 * from the log are far more surgical, but these are genuine mendoza and go
 * through the real applyPatch, so the plumbing is exercised for real.
 */
const literal = (value: unknown) => [0, value] as never;

const tx = (id: string, docId: string, before: unknown, after: unknown): TranslogTransaction => ({
  id,
  timestamp: '2026-08-28T12:00:00Z',
  documentIDs: [docId],
  effects: { [docId]: { apply: literal(after), revert: literal(before) } },
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
    // Verified against a live dataset 2026-08-28: excludeContent=false answers
    // 403 "This API requires excludeContent to be true". Effects come back
    // regardless, so there is nothing lost and this must never be flipped.
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
    const body = '{"id":"a"}\r\n\r\n{"id":"b"}\n';
    expect(parseTransactions(body).map((t) => t.id)).toEqual(['a', 'b']);
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
    const body = '{"error":{"description":"This API requires excludeContent to be true"}}';
    expect(() => parseTransactions(body)).toThrow(/excludeContent/);
  });
});

// -----------------------------------------------------------------------------
// Picking the step to undo
// -----------------------------------------------------------------------------

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

  it('nextUndoTarget skips our own writes and the steps already undone', () => {
    const txs = [
      tx('ours-2', DRAFT, {}, {}),
      tx('ours-1', DRAFT, {}, {}),
      tx('t3', DRAFT, {}, {}),
      tx('t2', DRAFT, {}, {}),
    ];
    const ours = new Set(['ours-1', 'ours-2']);
    expect(nextUndoTarget(txs, DRAFT, ours, new Set())?.id).toBe('t3');
    expect(nextUndoTarget(txs, DRAFT, ours, new Set(['t3']))?.id).toBe('t2');
    expect(nextUndoTarget(txs, DRAFT, ours, new Set(['t3', 't2']))).toBeNull();
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
// A miniature Sanity, so undo/redo can be exercised end to end
// -----------------------------------------------------------------------------
// It behaves the way the real one does in the two ways that matter: a write
// appends a transaction whose id becomes the document's `_rev`, and the
// transaction carries both directions of the change.

interface Doc extends Record<string, unknown> {
  _id: string;
  _type: string;
  _rev?: string;
}

function fakeSanity(initial: Record<string, Doc | undefined> = {}) {
  const docs = new Map<string, Doc>();
  const log: TranslogTransaction[] = [];
  let counter = 0;

  function write(id: string, next: Doc | undefined, transactionId?: string) {
    const txId = transactionId ?? `srv-${++counter}`;
    const before = docs.get(id);
    if (next) docs.set(id, { ...next, _rev: txId });
    else docs.delete(id);
    log.unshift({
      id: txId,
      documentIDs: [id],
      effects: {
        [id]: {
          apply: literal(next ? { ...next, _rev: undefined, _updatedAt: undefined } : null),
          revert: literal(before ? withoutRev(before) : null),
        },
      },
    });
    return docs.get(id);
  }

  for (const [id, doc] of Object.entries(initial)) if (doc) write(id, doc);

  const client = {
    config: () => ({ dataset: 'production' }),
    getDocument: async (id: string) => docs.get(id),
    request: async () => log.map((t) => JSON.stringify(t)).join('\n'),
    createOrReplace: async (doc: Doc, opts?: { transactionId?: string }) =>
      write(doc._id, doc, opts?.transactionId),
    delete: async (id: string, opts?: { transactionId?: string }) =>
      write(id, undefined, opts?.transactionId),
  };

  return {
    client: client as unknown as SanityClient,
    docs,
    log,
    /** An outside edit: someone else's mutation lands on the document. */
    edit: (id: string, patch: Partial<Doc>) => write(id, { ...docs.get(id)!, ...patch }),
  };
}

const page = (title: string, extra: Record<string, unknown> = {}): Doc => ({
  _id: DRAFT,
  _type: 'homePage',
  title,
  ...extra,
});

// -----------------------------------------------------------------------------
// Undo
// -----------------------------------------------------------------------------

describe('undo', () => {
  it('steps back one change, and a second undo steps back again', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    sanity.edit(DRAFT, page('two'));
    sanity.edit(DRAFT, page('three'));

    const first = await undoLast(sanity.client, DRAFT);
    expect(first.ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('two');

    // The second undo must go FURTHER back, not put 'three' back. Reading the
    // newest transaction naively would oscillate between two states forever.
    const second = await undoLast(sanity.client, DRAFT);
    expect(second.ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');
    expect(redoDepth(DRAFT)).toBe(2);
  });

  it('refuses when the document has moved since the log was read', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    // A write that the log we are about to read will not explain: pretend the
    // document rev drifted (a mutation still settling, or a colleague's edit).
    sanity.docs.set(DRAFT, { ...sanity.docs.get(DRAFT)!, _rev: 'somebody-else' });

    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'stale' });
  });

  it('has nothing to do on a document with no draft', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'nothing' });
  });

  it('runs out honestly once every step has been taken', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    sanity.edit(DRAFT, page('two'));
    expect((await undoLast(sanity.client, DRAFT)).ok).toBe(true);
    // 'one' was itself a create, and there is no published twin behind it.
    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'only-copy' });
  });

  it('undoing the change that created the draft removes the draft, twin permitting', async () => {
    resetUndoRedo();
    const sanity = fakeSanity({ homePage: { _id: 'homePage', _type: 'homePage', title: 'live' } });
    sanity.edit(DRAFT, page('a draft of it'));

    const result = await undoLast(sanity.client, DRAFT);
    expect(result.ok).toBe(true);
    expect(result.ok && result.removedDraft).toBe(true);
    expect(sanity.docs.has(DRAFT)).toBe(false);
    expect(sanity.docs.get('homePage')?.title).toBe('live');
  });

  it('refuses to remove the only copy of a document', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('the only copy'));

    expect(await undoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'only-copy' });
    expect(sanity.docs.get(DRAFT)?.title).toBe('the only copy');
  });
});

// -----------------------------------------------------------------------------
// Redo
// -----------------------------------------------------------------------------

describe('redo', () => {
  it('puts back exactly what the undo took away', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    sanity.edit(DRAFT, page('two'));

    await undoLast(sanity.client, DRAFT);
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');

    const result = await redoLast(sanity.client, DRAFT);
    expect(result.ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('two');
    expect(redoDepth(DRAFT)).toBe(0);
  });

  it('redo, undo, redo walks the same path twice', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    sanity.edit(DRAFT, page('two'));

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
    sanity.edit(DRAFT, page('a draft of it'));

    await undoLast(sanity.client, DRAFT);
    expect(sanity.docs.has(DRAFT)).toBe(false);

    expect((await redoLast(sanity.client, DRAFT)).ok).toBe(true);
    expect(sanity.docs.get(DRAFT)?.title).toBe('a draft of it');
  });

  it('an edit after an undo throws the redo away', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    sanity.edit(DRAFT, page('two'));

    await undoLast(sanity.client, DRAFT);
    expect(redoDepth(DRAFT)).toBe(1);

    // The editor types something. The state the redo pointed at is no longer on
    // the path forward, so the stack goes.
    sanity.edit(DRAFT, page('one and a bit'));
    expect(await redoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'nothing' });
    expect(redoDepth(DRAFT)).toBe(0);
    // And nothing was written.
    expect(sanity.docs.get(DRAFT)?.title).toBe('one and a bit');
  });

  it('undo after an outside edit starts again from the newest change', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    sanity.edit(DRAFT, page('two'));
    await undoLast(sanity.client, DRAFT);
    sanity.edit(DRAFT, page('three'));

    expect((await undoLast(sanity.client, DRAFT)).ok).toBe(true);
    // The newest change, undone.
    expect(sanity.docs.get(DRAFT)?.title).toBe('one');
  });

  it('has nothing to do before anything has been undone', async () => {
    resetUndoRedo();
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    expect(await redoLast(sanity.client, DRAFT)).toEqual({ ok: false, reason: 'nothing' });
  });
});

describe('fetchLastTransactions', () => {
  it('returns the log newest first', async () => {
    const sanity = fakeSanity();
    sanity.edit(DRAFT, page('one'));
    sanity.edit(DRAFT, page('two'));
    const txs = await fetchLastTransactions(sanity.client, DRAFT);
    expect(txs.length).toBe(2);
    expect(txs[0].id).toBe(sanity.docs.get(DRAFT)?._rev);
  });
});
