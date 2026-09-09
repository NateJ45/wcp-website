// =============================================================================
// hub-cache — the wait budget
// =============================================================================
// These tests pin the behaviour that keeps the Family Hub openable: a COLD read
// of a slow origin must not hold a page for longer than its budget, and the
// value must still reach the cache so the next request gets it. The module
// imports `cloudflare:workers`, which Node cannot resolve, so vitest.config.ts
// aliases that id to src/lib/test-stubs/cloudflare-workers.ts.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { cached, cachedWithin, FIRST_PAINT_WAIT_MS } from './hub-cache';

/** A fetch that answers after `ms`. */
const slow = <T>(value: T, ms: number) =>
  vi.fn(
    () =>
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(value), ms);
      }),
  );

/** A distinct cache key per test — the module store lives for the whole run. */
let n = 0;
const nextKey = () => `test:key:${++n}`;

describe('cachedWithin', () => {
  it('returns the value when the origin answers inside the budget', async () => {
    const fn = slow('answer', 5);
    const got = await cachedWithin(nextKey(), 60_000, fn, { maxWaitMs: 200 });
    expect(got).toBe('answer');
  });

  it('gives up on a slow COLD read instead of holding the caller', async () => {
    const key = nextKey();
    const fn = slow('late', 120);

    const started = Date.now();
    const first = await cachedWithin(key, 60_000, fn, { maxWaitMs: 20 });
    expect(first).toBeUndefined();
    expect(Date.now() - started).toBeLessThan(100);

    // The origin still finishes, so the NEXT read is a warm hit — that is what
    // makes a missed budget cost one request, not every request.
    await new Promise((r) => setTimeout(r, 150));
    const second = await cachedWithin(key, 60_000, fn, { maxWaitMs: 20 });
    expect(second).toBe('late');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('reads a failing origin as no value, never as a rejection', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('origin down')));
    await expect(cachedWithin(nextKey(), 60_000, fn, { maxWaitMs: 50 })).resolves.toBeUndefined();
  });

  it('defaults to the first-paint budget', async () => {
    expect(FIRST_PAINT_WAIT_MS).toBeGreaterThan(0);
    const fn = slow('quick', 1);
    await expect(cachedWithin(nextKey(), 60_000, fn)).resolves.toBe('quick');
  });
});

describe('cached', () => {
  it('still waits for the origin, however slow — no budget means no ceiling', async () => {
    const fn = slow('worth the wait', 60);
    await expect(cached(nextKey(), 60_000, fn)).resolves.toBe('worth the wait');
  });

  it('still rejects when the origin fails, so callers keep their fallbacks', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('origin down')));
    await expect(cached(nextKey(), 60_000, fn)).rejects.toThrow('origin down');
  });

  it('runs the origin once per fresh window', async () => {
    const key = nextKey();
    const fn = slow('once', 1);
    await cached(key, 60_000, fn);
    await cached(key, 60_000, fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
