// =============================================================================
// giggles — a wholesome "giggle of the day" for the foot of the hub home
// =============================================================================
// A tiny, inconspicuous treat at the very bottom of the dashboard. Curated
// (not a live joke API) so every one is guaranteed kid-safe, and so it costs
// zero external fetches / KV writes. Picked DETERMINISTICALLY from the Eastern
// date — no Math.random (unavailable in the Workers runtime, and it would make
// SSR non-deterministic); the joke changes once a day and is the same for
// everyone that day.
// =============================================================================

export interface Giggle {
  setup: string;
  punchline: string;
}

const GIGGLES: Giggle[] = [
  { setup: 'Why did the teddy bear say no to dessert?', punchline: 'Because she was stuffed!' },
  { setup: 'What do you call a bear with no teeth?', punchline: 'A gummy bear!' },
  { setup: 'Why did the cookie go to the doctor?', punchline: 'Because it felt crummy!' },
  { setup: 'What do you call a dinosaur that takes a nap?', punchline: 'A dino-snore!' },
  { setup: 'What do you call a sleeping crayon?', punchline: 'A nap-kin!' },
  { setup: 'Why did the banana go to the party?', punchline: 'Because it was a-peeling!' },
  { setup: 'What do you call cheese that isn’t yours?', punchline: 'Nacho cheese!' },
  { setup: 'Why can’t you give Elsa a balloon?', punchline: 'Because she’ll let it go!' },
  { setup: 'What did the ocean say to the beach?', punchline: 'Nothing, it just waved!' },
  { setup: 'Why did the crayon get in trouble?', punchline: 'For coloring outside the lines!' },
  { setup: 'What has ears but cannot hear?', punchline: 'A cornfield!' },
  { setup: 'Why do bees have sticky hair?', punchline: 'Because they use honeycombs!' },
  { setup: 'What do you call a pig that does karate?', punchline: 'A pork chop!' },
  { setup: 'What is a frog’s favorite drink?', punchline: 'Croak-a-cola!' },
  {
    setup: 'Why did the student eat his homework?',
    punchline: 'The teacher said it was a piece of cake!',
  },
  { setup: 'What do you call a dog magician?', punchline: 'A labra-cadabra-dor!' },
  { setup: 'How do you make a tissue dance?', punchline: 'You put a little boogie in it!' },
  { setup: 'What did one snowman say to the other?', punchline: 'Do you smell carrots?' },
  { setup: 'Why did the picture go to jail?', punchline: 'Because it was framed!' },
  { setup: 'What do you call a fish wearing a bowtie?', punchline: 'So-fish-ticated!' },
  { setup: 'Why was the math book sad?', punchline: 'Because it had too many problems!' },
  { setup: 'What do elves learn in school?', punchline: 'The elf-abet!' },
  { setup: 'What is brown and sticky?', punchline: 'A stick!' },
  {
    setup: 'Why did the golfer bring two pairs of pants?',
    punchline: 'In case he got a hole in one!',
  },
  { setup: 'What do you call a duck that gets all A’s?', punchline: 'A wise quacker!' },
  { setup: 'What kind of tree fits in your hand?', punchline: 'A palm tree!' },
  { setup: 'Why did the tomato turn red?', punchline: 'Because it saw the salad dressing!' },
  { setup: 'What is a cat’s favorite color?', punchline: 'Purr-ple!' },
  { setup: 'How do you catch a whole school of fish?', punchline: 'With a bookworm!' },
  { setup: 'What did the little corn say to the mama corn?', punchline: 'Where is pop corn?' },
  { setup: 'Why do cows wear bells?', punchline: 'Because their horns don’t work!' },
  { setup: 'What is an astronaut’s favorite part of a computer?', punchline: 'The space bar!' },
  { setup: 'Why did the bicycle fall over?', punchline: 'Because it was two-tired!' },
  { setup: 'What do you call a snowman in July?', punchline: 'A puddle!' },
  { setup: 'What do you call a boomerang that won’t come back?', punchline: 'A stick!' },
];

/**
 * The day's giggle (Eastern date drives a stable daily pick). Board giggles
 * from the Studio (Family Hub → Little delights) JOIN the committed pool, so
 * a growing collection spreads across the calendar on its own.
 */
export function todaysGiggle(now: Date = new Date(), boardRows?: Giggle[] | null): Giggle {
  const extras = (boardRows ?? []).filter((g) => g?.setup?.trim() && g.punchline?.trim());
  const pool = [...GIGGLES, ...extras];
  const [m, d] = now
    .toLocaleDateString('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit' })
    .split('/')
    .map(Number);
  // A simple deterministic spread across the year; changes each day.
  const idx = (m * 31 + d) % pool.length;
  return pool[idx];
}
