import { describe, it, expect } from 'vitest';
import { budgetTotals, groupTotal, groupPriorTotal } from './budget';

// The real 2026-27 subtotals, so this pins the migration: the figures the
// committed data file carried must still come out of the derivation.
const GROUPS = [
  {
    label: 'Tuition & fees',
    kind: 'revenue' as const,
    lines: [
      { label: 'Tuition', now: 54_810, was: 30_240 },
      { label: 'Registration', now: 3_800, was: 2_500 },
      { label: 'Student fees', now: 1_855, was: 1_085 },
      { label: 'Participation deposit', now: 1_000, was: 600 },
    ],
  },
  {
    label: 'Fundraising',
    kind: 'revenue' as const,
    lines: [{ label: 'Raffle', now: 5_700, was: 4_000 }],
  },
  {
    label: 'Operating costs',
    kind: 'expense' as const,
    lines: [{ label: 'Insurance', now: 23_574, was: 20_000 }],
  },
  {
    label: 'Programs',
    kind: 'expense' as const,
    lines: [{ label: 'Salaries', now: 43_692, was: 40_000 }],
  },
];

describe('budgetTotals', () => {
  it('reproduces the 2026-27 headline figures from the lines alone', () => {
    expect(budgetTotals(GROUPS)).toEqual({
      revenue: 67_165,
      expenses: 67_266,
      net: -101,
    });
  });

  it('reports a surplus as a positive net', () => {
    const better = GROUPS.map((g) =>
      g.label === 'Tuition & fees'
        ? { ...g, lines: [...g.lines, { label: 'Extra enrolment', now: 500 }] }
        : g,
    );
    expect(budgetTotals(better).net).toBe(399);
  });

  it('counts an unclassified section as a COST, never as income', () => {
    // Being wrong in the direction that flatters the budget is the wrong way to
    // be wrong, so a missing `kind` is treated as money going out.
    const messy = [{ label: 'Mystery', lines: [{ label: 'x', now: 1_000 }] }];
    expect(budgetTotals(messy)).toEqual({ revenue: 0, expenses: 1_000, net: -1_000 });
  });

  it('ignores blank and non-finite amounts rather than poisoning the column', () => {
    const gappy = [
      {
        label: 'Income',
        kind: 'revenue' as const,
        lines: [
          { label: 'a', now: 100 },
          { label: 'b', now: null },
          { label: 'c' },
          { label: 'd', now: Number.NaN },
        ],
      },
    ];
    expect(budgetTotals(gappy).revenue).toBe(100);
  });

  it('survives an empty or missing budget', () => {
    expect(budgetTotals([])).toEqual({ revenue: 0, expenses: 0, net: 0 });
    expect(budgetTotals(null)).toEqual({ revenue: 0, expenses: 0, net: 0 });
    expect(budgetTotals(undefined)).toEqual({ revenue: 0, expenses: 0, net: 0 });
  });
});

describe('group subtotals', () => {
  it('adds up this year and last year separately', () => {
    expect(groupTotal(GROUPS[0])).toBe(61_465);
    expect(groupPriorTotal(GROUPS[0])).toBe(34_425);
  });

  it('returns zero for a section with no lines', () => {
    expect(groupTotal({ label: 'Empty', kind: 'expense' })).toBe(0);
    expect(groupPriorTotal(null)).toBe(0);
  });

  it('treats a brand-new line as zero last year, not as a gap', () => {
    const g = { label: 'x', kind: 'expense' as const, lines: [{ label: 'New thing', now: 500 }] };
    expect(groupTotal(g)).toBe(500);
    expect(groupPriorTotal(g)).toBe(0);
  });
});
