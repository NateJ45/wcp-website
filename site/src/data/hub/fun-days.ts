// =============================================================================
// fun-days — a curated "Today is ..." observance for the hub greeting
// =============================================================================
// A little delight on the home dashboard: a playful national/world day that
// doubles as a classroom theme-day nudge. CURATED, not a live "national day"
// API, on purpose: those feeds are peppered with adult-only entries (National
// Vodka Day, etc.) that have no place on a preschool site. Keyed by MM-DD in
// EASTERN time (the Workers runtime is UTC, so we format the date through
// America/New_York — same gotcha as the greeting/date logic). Days with no
// entry simply show nothing; it's a bonus, not a fixture. Add more freely.
// =============================================================================

const FUN_DAYS: Record<string, string> = {
  '01-21': 'National Hugging Day',
  '01-28': 'National Kazoo Day',
  '02-04': 'World Read Aloud Day',
  '02-09': 'National Pizza Day',
  '02-17': 'Random Acts of Kindness Day',
  '02-20': 'Love Your Pet Day',
  '02-27': 'National Polar Bear Day',
  '03-01': 'National Peanut Butter Lover’s Day',
  '03-14': 'Pi Day',
  '03-20': 'First Day of Spring',
  '03-22': 'National Goof Off Day',
  '03-31': 'National Crayon Day',
  '04-11': 'National Pet Day',
  '04-12': 'National Grilled Cheese Day',
  '04-22': 'Earth Day',
  '04-28': 'National Superhero Day',
  '05-04': 'National Star Wars Day',
  '05-15': 'National Chocolate Chip Day',
  '05-25': 'National Tap Dance Day',
  '06-01': 'National Say Something Nice Day',
  '06-08': 'Best Friends Day',
  '06-18': 'National Go Fishing Day',
  '06-21': 'First Day of Summer',
  '07-11': 'National Blueberry Muffin Day',
  '07-16': 'National Ice Cream Day',
  '07-17': 'World Emoji Day',
  '07-30': 'International Day of Friendship',
  '08-03': 'National Watermelon Day',
  '08-10': 'National S’mores Day',
  '08-16': 'National Tell a Joke Day',
  '08-26': 'National Dog Day',
  '09-06': 'Read a Book Day',
  '09-13': 'National Peanut Day',
  '09-19': 'Talk Like a Pirate Day',
  '09-22': 'First Day of Fall',
  '09-28': 'National Good Neighbor Day',
  '10-04': 'National Taco Day',
  '10-16': 'Dictionary Day',
  '10-28': 'National Chocolate Day',
  '11-03': 'National Sandwich Day',
  '11-13': 'World Kindness Day',
  '11-17': 'National Take a Hike Day',
  '11-26': 'National Cake Day',
  '12-04': 'National Cookie Day',
  '12-16': 'National Chocolate-Covered Anything Day',
  '12-21': 'First Day of Winter',
  '12-28': 'National Card Playing Day',
};

/** Today's curated fun day (Eastern), or null when there's no entry. */
export function todaysFunDay(now: Date = new Date()): string | null {
  // "07/16" in Eastern → "07-16". Month/day only, so it's year-agnostic.
  const key = now
    .toLocaleDateString('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit' })
    .replace('/', '-');
  return FUN_DAYS[key] ?? null;
}
