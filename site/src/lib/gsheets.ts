// =============================================================================
// Google Sheets (gviz) reader — the treasurer's live budget/fundraising data
// =============================================================================
// The Budget Google Sheet is shared "anyone with the link can view", and its
// `gviz/tq` endpoint serves any tab as JSONP-ish text:
//     google.visualization.Query.setResponse({...});
// so the JSON has to be cut out from between the outer parens (there is no
// plain-JSON mode for this endpoint). Fetched SERVER-SIDE inside the hub gate,
// so the numbers only ever render for signed-in families.
//
// Every reader returns null/[] on any failure — the widgets degrade to their
// designed empty states, never a broken card. A short timeout keeps a slow
// Google response from stalling hub SSR.
// =============================================================================

interface GvizCell {
  v?: unknown;
  f?: string;
}

/** Fetch one sheet tab's rows as a cell matrix. Throws on any failure. */
export async function fetchSheetRows(sheetId: string, tab: string): Promise<GvizCell[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`gviz ${res.status}`);
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf('(') + 1, text.lastIndexOf(')')));
  const rows: { c?: (GvizCell | null)[] }[] = json?.table?.rows ?? [];
  return rows.map((r) => (r.c ?? []).map((c) => c ?? {}));
}

const cellStr = (c?: GvizCell): string => String(c?.v ?? c?.f ?? '').trim();
const cellNum = (c?: GvizCell): number => {
  const n = typeof c?.v === 'number' ? c.v : parseFloat(String(c?.v ?? c?.f ?? ''));
  return Number.isFinite(n) ? n : 0;
};

// -----------------------------------------------------------------------------
// Budget tab — key/value rows: cash_balance, revenue_budgeted, revenue_actual,
// expenses_budgeted, expenses_actual, month.
// -----------------------------------------------------------------------------

export interface BudgetSnapshot {
  cash: number;
  revenueBudgeted: number;
  revenueActual: number;
  expensesBudgeted: number;
  expensesActual: number;
  /** e.g. "May 2026" — the month the numbers were last updated. */
  monthLabel: string;
}

/** The Budget tab's month cell arrives as a Sheets date serial, a
 *  "Date(y,m,d)" string, or plain text — normalize all three. */
function monthLabel(raw: unknown): string {
  if (typeof raw === 'number' && raw > 40000) {
    const d = new Date((raw - 25569) * 86_400_000);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  const s = String(raw ?? '').trim();
  if (s.startsWith('Date(')) {
    const p = s.replace('Date(', '').replace(')', '').split(',');
    return new Date(Number(p[0]), Number(p[1]), Number(p[2] ?? 1)).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
  return s.length > 4 ? s : 'Current';
}

/** Read the Budget tab. Returns null on any failure (widget shows empty state). */
export async function getBudgetSnapshot(sheetId: string): Promise<BudgetSnapshot | null> {
  try {
    const rows = await fetchSheetRows(sheetId, 'Budget');
    const kv: Record<string, GvizCell> = {};
    for (const r of rows) {
      const key = cellStr(r[0]);
      if (key) kv[key] = r[1] ?? {};
    }
    if (!('cash_balance' in kv)) return null;
    return {
      cash: cellNum(kv.cash_balance),
      revenueBudgeted: cellNum(kv.revenue_budgeted),
      revenueActual: cellNum(kv.revenue_actual),
      expensesBudgeted: cellNum(kv.expenses_budgeted),
      expensesActual: cellNum(kv.expenses_actual),
      monthLabel: monthLabel(kv.month?.v ?? kv.month?.f),
    };
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Fundraising tab — one row per campaign: name, goal, raised, status
// (active / upcoming / complete), plus optional timeframe.
// -----------------------------------------------------------------------------

export type FundraiserStatus = 'active' | 'upcoming' | 'complete';

export interface Fundraiser {
  name: string;
  goal: number;
  raised: number;
  status: FundraiserStatus;
  /** Optional free text like "October 2026" (sheet column E). */
  timeframe?: string;
}

/** Read the Fundraising tab. Returns [] on any failure. */
export async function getFundraisers(sheetId: string): Promise<Fundraiser[]> {
  try {
    const rows = await fetchSheetRows(sheetId, 'Fundraising');
    const items: Fundraiser[] = [];
    for (const r of rows) {
      const name = cellStr(r[0]);
      if (!name) continue;
      const raw = cellStr(r[3]).toLowerCase();
      const status: FundraiserStatus =
        raw === 'active' || raw === 'complete' ? (raw as FundraiserStatus) : 'upcoming';
      items.push({
        name,
        goal: cellNum(r[1]),
        raised: cellNum(r[2]),
        status,
        timeframe: cellStr(r[4]) || undefined,
      });
    }
    // Active first, then upcoming, then complete (the old hub's ordering).
    const order: Record<FundraiserStatus, number> = { active: 0, upcoming: 1, complete: 2 };
    items.sort((a, b) => order[a.status] - order[b.status]);
    return items;
  } catch {
    return [];
  }
}
