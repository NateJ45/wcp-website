// =============================================================================
// budget — totals for the Family Hub's operating-budget table
// =============================================================================
// Every total on that page is ADDED UP from the line items: group subtotals,
// target revenue, total expenses, and the net. None of them is stored.
//
// That is deliberate. The budget used to live in src/data/hub/budget.ts with the
// three headline figures typed in alongside the lines, which is exactly the
// shape that drifts — edit a line, forget the total, and the summary quietly
// contradicts the table beneath it. A Treasurer editing this in the Studio types
// lines and nothing else.
//
// Pure and unit-tested: no Sanity client, no Astro.
// =============================================================================

export interface BudgetLine {
  label?: string | null;
  /** This year's figure, in whole dollars. */
  now?: number | null;
  /** Last year's figure, for the comparison column. */
  was?: number | null;
  note?: string | null;
}

export interface BudgetGroup {
  label?: string | null;
  kind?: 'revenue' | 'expense' | string | null;
  icon?: string | null;
  lines?: BudgetLine[] | null;
}

export interface BudgetTotals {
  /** Everything in the income sections. */
  revenue: number;
  /** Everything in the cost sections. */
  expenses: number;
  /** revenue - expenses. Negative is a planned shortfall. */
  net: number;
}

/** Sum a field across lines, treating anything non-numeric as absent. */
function sum(lines: BudgetLine[] | null | undefined, field: 'now' | 'was'): number {
  let total = 0;
  for (const line of lines ?? []) {
    const v = line?.[field];
    // Guard NaN as well as null: a Studio number field that has been typed into
    // and cleared can arrive as NaN, and one NaN would poison the whole column.
    if (typeof v === 'number' && Number.isFinite(v)) total += v;
  }
  return total;
}

/** This year's subtotal for one section. */
export const groupTotal = (group?: BudgetGroup | null): number => sum(group?.lines, 'now');

/** Last year's subtotal for one section. */
export const groupPriorTotal = (group?: BudgetGroup | null): number => sum(group?.lines, 'was');

/**
 * Roll the sections up into the three headline figures.
 *
 * A section with no `kind` counts as a cost. Treating an unclassified section as
 * income would inflate the revenue line and make the budget look healthier than
 * it is, which is the wrong way to be wrong about money.
 */
export function budgetTotals(groups?: BudgetGroup[] | null): BudgetTotals {
  let revenue = 0;
  let expenses = 0;
  for (const group of groups ?? []) {
    const total = groupTotal(group);
    if (group?.kind === 'revenue') revenue += total;
    else expenses += total;
  }
  return { revenue, expenses, net: revenue - expenses };
}
