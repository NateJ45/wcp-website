// =============================================================================
// budget.ts — the member-approved 2026-27 operating budget, for the hub table
// =============================================================================
// Transcribed from the Treasurer's "WCP 2026-27 Proposed Operating Budget" (the
// member-vote PDF in src/assets). Each line carries this year's proposed figure
// and last year's budget for the same comparison the PDF makes, plus the note.
// Granular sub-breakdowns (publicity items, per-class outings) are folded into
// the line NOTE so the hub table stays scannable. Subtotals are derived in the
// component from the lines, so they can never drift from the numbers above them.
// UPDATE each year when the Board approves a new budget.
// =============================================================================

export interface BudgetLine {
  label: string;
  /** This year's proposed figure (SY26-27). */
  now: number;
  /** Last year's budget (SY25-26), for the year-over-year comparison. */
  was?: number;
  /** Plain-English context / sub-breakdown. */
  note?: string;
}

export interface BudgetGroup {
  key: string;
  label: string;
  /** Revenue groups tint green, expense groups tint navy. */
  kind: 'revenue' | 'expense';
  lines: BudgetLine[];
}

export const budgetMeta = {
  year: '2026-27',
  priorYear: '2025-26',
  targetRevenue: 67_165,
  totalExpenses: 67_266,
  /** Revenue minus expenses (negative = planning shortfall). */
  net: -101,
  netNote: 'At 39 students; a surplus at 40 or more',
  enrollment: '39 students projected, of 43 seats',
  source: 'Member-approved operating budget',
};

export const budgetGroups: BudgetGroup[] = [
  {
    key: 'revenue',
    label: 'Tuition & fees',
    kind: 'revenue',
    lines: [
      {
        label: 'Tuition',
        now: 54_810,
        was: 30_240,
        note: 'Based on 39 students, four seats below the 43-student capacity',
      },
      { label: 'Registration', now: 3_800, was: 2_500, note: 'One-time enrollment fee per family' },
      {
        label: 'Student fees',
        now: 1_855,
        was: 1_085,
        note: 'Per-student supply and activity fees',
      },
      {
        label: 'Participation deposit',
        now: 1_000,
        was: 600,
        note: 'Refunded when co-op hours are complete',
      },
    ],
  },
  {
    key: 'fundraising',
    label: 'Fundraising',
    kind: 'revenue',
    lines: [
      { label: 'Store sales', now: 150, was: 150, note: 'Branded apparel and merch for families' },
      {
        label: 'Kroger Community Rewards',
        now: 150,
        was: 150,
        note: 'Passive earnings from linked Kroger cards',
      },
      { label: 'Fall flower sales (mums)', now: 1_500, was: 1_000, note: 'Annual mum sale' },
      { label: 'Spring flower sales', now: 1_000, was: 750, note: 'Annual spring planter sale' },
      { label: 'DoubleGood popcorn', now: 1_900, was: 1_800, note: 'Online popcorn fundraiser' },
      { label: "Mike's Car Wash", now: 1_000, was: 0, note: 'New this year' },
    ],
  },
  {
    key: 'operating',
    label: 'Operating expenses',
    kind: 'expense',
    lines: [
      { label: 'Rent', now: 10_125, was: 9_600, note: 'Facility lease' },
      { label: 'Insurance', now: 4_000, was: 3_100, note: 'Liability and property coverage' },
      {
        label: 'Legal & professional',
        now: 4_000,
        was: 4_000,
        note: 'Accountant, QuickBooks, DocuSign',
      },
      { label: 'Telephone', now: 168, was: 600, note: 'Switched from AltaFiber to Google Voice' },
      { label: 'Playground maintenance', now: 1_000, was: 2_000 },
      { label: 'Licenses & permits', now: 100, was: 100 },
      {
        label: 'Publicity',
        now: 1_566,
        was: 1_000,
        note: 'Meta & Google ads $800, printed materials $350, Canva $120, domain $296',
      },
      { label: 'Subscriptions', now: 120, was: 100, note: 'Scholastic Book magazines' },
      { label: 'Office supplies', now: 100, was: 100 },
      {
        label: 'School supplies',
        now: 2_200,
        was: 1_200,
        note: "2's $450, 3's $650, Pre-K $1,100",
      },
      { label: 'Postage', now: 30, was: 30 },
      { label: 'Copier expenses', now: 0, was: 300, note: 'Moved from paper packets to DocuSign' },
      {
        label: 'Fingerprinting reimbursements',
        now: 165,
        was: 210,
        note: 'Background checks for staff and Super Helpers',
      },
    ],
  },
  {
    key: 'programs',
    label: 'Programs, events & payroll',
    kind: 'expense',
    lines: [
      {
        label: 'Family outings (enrichment)',
        now: 1_092,
        was: 470,
        note: "$12 per student per trip · 2's $84, 3's $288, Pre-K AM $432, PM $288",
      },
      {
        label: 'Special events',
        now: 600,
        was: 500,
        note: 'VIP nights, End-of-Year picnic, Open House, Teacher Appreciation',
      },
      {
        label: 'Teacher education',
        now: 600,
        was: 750,
        note: 'Workshops $300, Super Helper / sub CPR incentive $300',
      },
      { label: 'Wages', now: 39_500, was: 25_559, note: 'Teacher and staff compensation' },
      {
        label: 'Participation deposit return',
        now: 1_000,
        was: 700,
        note: 'Refunded to families who complete co-op hours',
      },
      {
        label: 'Board member stipends',
        now: 900,
        was: 1_050,
        note: 'President $450, VP $150, Secretary $150, Treasurer $150',
      },
    ],
  },
];
