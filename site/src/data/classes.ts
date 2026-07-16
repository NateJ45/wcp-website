// =============================================================================
// WCP classes — the four programs (2026-27)
// =============================================================================
// Single source of truth for class facts used across the Family Hub class pages
// (and available to refactor the public class pages onto later). Figures mirror
// the current live tuition block. PayPal `payId` values are the school's real
// hosted-button ids for the gated pay buttons.
// =============================================================================

export interface WcpClass {
  slug: 'twos' | 'threes' | 'pre-k-am' | 'pre-k-pm';
  name: string;
  /** Lucide icon used on the hub nav + class hero. */
  icon: string;
  /** Short positioning line from the old hub hero. */
  tagline: string;
  days: string;
  daysCount: string;
  time: string;
  age: string;
  monthly: string;
  annual: string;
  /** Annual student/enrichment fee for this class. */
  studentFee: string;
  /** PayPal hosted-button id for this class's monthly tuition. */
  payId: string;
  /** PayPal hosted-button id for this class's student fee. */
  studentFeePayId: string;
}

export const classes: WcpClass[] = [
  {
    slug: 'twos',
    name: 'Twos',
    icon: 'blocks',
    tagline: 'A gentle first taste of school, in a small group.',
    days: 'Thursdays',
    daysCount: '1 day per week',
    time: '9:30 am – 12:00 pm',
    age: 'Age 2 by Sept 30',
    monthly: '$70',
    annual: '$630',
    studentFee: '$45',
    payId: 'NBFM9AD6GTW7A',
    studentFeePayId: 'GQZ67ZRZ4W9UN',
  },
  {
    slug: 'threes',
    name: 'Threes',
    icon: 'sprout',
    tagline: 'A joyful first real school experience.',
    days: 'Mon, Tue, Wed',
    daysCount: '3 days per week',
    time: '9:30 am – 12:00 pm',
    age: 'Age 3 by Sept 30',
    monthly: '$150',
    annual: '$1,350',
    studentFee: '$45',
    payId: 'J7HLQFJU8NRAG',
    studentFeePayId: 'GQZ67ZRZ4W9UN',
  },
  {
    slug: 'pre-k-am',
    name: 'Pre-K AM',
    icon: 'sun',
    tagline: 'Kindergarten readiness, four mornings a week.',
    days: 'Mon, Tue, Wed, Thu',
    daysCount: '4 days per week',
    time: '9:15 am – 12:00 pm',
    age: 'Age 4 by Sept 30',
    monthly: '$200',
    annual: '$1,800',
    studentFee: '$50',
    payId: '3WPPH6QVGPPCJ',
    studentFeePayId: 'A797LM4LL5PGJ',
  },
  {
    slug: 'pre-k-pm',
    name: 'Pre-K PM',
    icon: 'moon',
    tagline: 'Kindergarten readiness on an afternoon schedule.',
    days: 'Mon, Tue, Wed',
    daysCount: '3 days per week',
    time: '12:30 pm – 3:15 pm',
    age: 'Age 4 by Sept 30',
    monthly: '$175',
    annual: '$1,575',
    studentFee: '$50',
    payId: '63E76WAWQL5WJ',
    studentFeePayId: 'A797LM4LL5PGJ',
  },
];

export const classBySlug = Object.fromEntries(classes.map((c) => [c.slug, c])) as Record<
  WcpClass['slug'],
  WcpClass
>;

/** Build the PayPal hosted-button checkout URL for a given button id. */
export const payUrl = (hostedButtonId: string) =>
  `https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=${hostedButtonId}`;
