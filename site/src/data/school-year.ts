// =============================================================================
// The WCP school year — events & celebrations (Sept–May)
// =============================================================================
// FALLBACK ONLY. This content is Board-editable in the Studio (schoolYearEvent documents);
// src/lib/cms.ts getSchoolYearEvents() reads those and uses this array only when Sanity
// has none or the read fails. Edit the Studio, not this file. The rhythm of a year at WCP: the community
// moments families talk about long after their kids graduate. Verbatim from
// the live site. Icons are Lucide names resolved by Icon.astro.
// =============================================================================

export interface SchoolYearEvent {
  month: string;
  title: string;
  body: string;
  icon: string;
  /** Section-accent color for this event's marker. */
  accent: 'orange' | 'sky' | 'amber' | 'green';
}

export const schoolYear: SchoolYearEvent[] = [
  {
    month: 'September',
    title: 'Start of School Picnic',
    body: 'Kick off the year with a community picnic. Families meet, kids run around, and the school year starts on the best possible note.',
    icon: 'tent',
    accent: 'green',
  },
  {
    month: 'October',
    title: 'Fall Parties',
    body: 'Costumes, crafts, and classroom celebrations. One of the most anticipated events of the fall semester.',
    icon: 'party-popper',
    accent: 'orange',
  },
  {
    month: 'November',
    title: 'Thanksgiving Sharing',
    body: 'A chance for children to practice gratitude and share something meaningful with their class community.',
    icon: 'heart-handshake',
    accent: 'amber',
  },
  {
    month: 'December',
    title: 'Holiday Party',
    body: 'Seasonal crafts, songs, and celebrations to close out the first semester together as a class.',
    icon: 'gift',
    accent: 'sky',
  },
  {
    month: 'February',
    title: "Valentine's Party",
    body: 'Cards, treats, and a morning focused on kindness and friendship — a highlight for three and four-year-olds especially.',
    icon: 'heart',
    accent: 'orange',
  },
  {
    month: 'April',
    title: 'Easter Egg Hunt',
    body: 'A WCP tradition. Kids hunt eggs on the playground and the whole school feels like spring has arrived.',
    icon: 'egg',
    accent: 'green',
  },
  {
    month: 'May',
    title: 'Class Graduations',
    body: 'Pre-K graduation is a proper celebration. Caps, certificates, and a room full of proud parents who have watched their kids grow all year.',
    icon: 'graduation-cap',
    accent: 'amber',
  },
  {
    month: 'All Year',
    title: 'Enrichment Program',
    body: 'Optional extracurricular activities led by WCP teachers or qualified instructors. A chance for kids to explore new interests beyond the regular class schedule.',
    icon: 'sparkles',
    accent: 'sky',
  },
];
