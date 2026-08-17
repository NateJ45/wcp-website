// =============================================================================
// Parent testimonials — real, named quotes from WCP families
// =============================================================================
// FALLBACK ONLY. This content is Board-editable in the Studio (testimonial documents);
// src/lib/cms.ts getTestimonials() reads those and uses this array only when Sanity
// has none or the read fails. Edit the Studio, not this file. Every quote here is verbatim from a real
// WCP family as published on the live site's "Family Stories" wall. Do not
// invent or reword quotes — they are real people's words.
//
// `tags` let a class page pull the quotes most relevant to it (e.g. the Twos
// page shows quotes tagged 'twos'); `featured` surfaces a quote on the home
// page. A quote with no tags is general and can appear anywhere.
// =============================================================================

export type TestimonialTag = 'twos' | 'threes' | 'prek' | 'alumni';

export interface Testimonial {
  quote: string;
  author: string;
  /** How they relate to WCP, e.g. "Pre-K Parent", "Alumni Parent". */
  role: string;
  tags?: TestimonialTag[];
  /** Surface on the home page's short testimonial row. */
  featured?: boolean;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'My only regret is not finding this place sooner. I have complete confidence that my son is prepared for kindergarten because of his time at WCP.',
    author: 'Alison Blankenship',
    role: 'Pre-K Parent',
    tags: ['prek'],
    featured: true,
  },
  {
    quote:
      'Mrs. Lisa is so patient and kind. The co-op aspect is a huge positive — I love getting to help in the classroom and be involved in school decisions. We loved it so much we enrolled our second child in the Twos class.',
    author: 'Erin McQuillen',
    role: 'WCP Parent',
    tags: ['prek', 'twos'],
  },
  {
    quote:
      'I loved the sense of community at WCP. We gained lifelong friends. It was wonderful to take such a hands-on role in my children’s first educational experience.',
    author: 'Katherine Oliver',
    role: 'Alumni Parent',
    tags: ['alumni'],
  },
  {
    quote:
      'I toured a lot of Pre-K programs. Many did not let parents even in the building. When I heard WCP was parent-run, I knew it was the school for us. The teachers are wonderful. The families are wonderful. It is such a unique and special place.',
    author: 'Erin Schmerr',
    role: 'WCP Parent',
    tags: ['prek'],
  },
  {
    quote:
      'I was worried about my pandemic baby’s socialization after so much time at home. WCP has done a fantastic job helping him become independent, social, and confident. We are already signed up for the Threes program.',
    author: 'Taylor Dore',
    role: 'Twos Parent',
    tags: ['twos'],
    featured: true,
  },
  {
    quote:
      'It is amazing to watch your child learn and emotionally mature in a safe environment. This type of involvement is only possible at a cooperative school.',
    author: 'Lauren Lintz',
    role: 'WCP Parent',
  },
  {
    quote:
      'Being part of their journey gives you a front-row seat to their growth while building your village and connecting with the community. The teachers are truly invested in the kids, and it shows. WCP is one of a kind.',
    author: 'Amanda Hackney',
    role: 'WCP Parent',
    featured: true,
  },
  {
    quote:
      'Moving to a new area not knowing anyone was overwhelming. Finding WCP gave us an instant community. Having the opportunity to be part of our children’s education is a gift I will always cherish.',
    author: 'Laura Gilbert',
    role: 'Alumni Parent',
    tags: ['alumni'],
  },
  {
    quote:
      'It is a place where everyone is on the educational team. My son has grown from the time, attention, and care shown to him. A great balance of learning and play — I would highly recommend it.',
    author: 'Valerie Williams',
    role: 'WCP Parent',
  },
  {
    quote:
      'It has been amazing to see Alexander thrive — making friends, growing in confidence, and forming a great bond with Mrs. Erin. Beyond his experience, I loved being part of the co-op community. Without a doubt, we are sending our youngest here too.',
    author: 'Nathan Nixon',
    role: 'Twos & Threes Parent',
    tags: ['twos', 'threes'],
  },
  {
    quote:
      'Our first year at WCP has been amazing. My son loves his teacher and his friends. The teachers and parents here are a blessing — I could not recommend this school more.',
    author: 'Amber Cron',
    role: 'Threes Parent',
    tags: ['threes'],
    featured: true,
  },
  {
    quote:
      'This school cares immensely about its students. My son loves going to school because he has a great time learning through play. The teachers go above and beyond — we could not recommend WCP more.',
    author: 'Meagan Gegner',
    role: 'Pre-K Parent',
    tags: ['prek'],
    featured: true,
  },
  {
    quote:
      'I love being part of my kids’ first experience of school. I know all their classmates and have formed real relationships with their parents. This school is a true community.',
    author: 'Erin Millspaw',
    role: 'WCP Parent',
  },
  {
    quote:
      'A wonderful school where teachers care for each student as an individual and parents get to have direct impact. We loved it so much we signed our daughter up to join her brother next year.',
    author: 'Daniel Hagedorn',
    role: 'Pre-K Parent',
    tags: ['prek'],
  },
  {
    quote:
      'I love getting to be involved in the classroom and watch my son blossom. Malcolm loves it here — and since it is a smaller school with involved parents, I get to build real relationships with the other families too.',
    author: 'Emily Wilkes',
    role: 'WCP Parent',
  },
  {
    quote:
      'Ms. Erin is a great teacher and our daughter adores her as do all the students. Getting to know the teachers and parents helps not only the kids but us to branch out socially. Your child will have a blast here.',
    author: 'Jessica Swarr',
    role: 'WCP Parent',
    tags: ['twos', 'threes'],
  },
  {
    quote:
      'Being able to take part in the classroom and see your kid in their environment has been so fun. The teachers and parents are amazing and make it such an easy and fun environment. My four year old loves it.',
    author: 'Kayla Moormann',
    role: 'Pre-K Parent',
    tags: ['prek'],
  },
  {
    quote:
      'Our first year at this school and we have registered for a 2nd year. Our child loves it and so do we. Staff and parents are great.',
    author: 'Lisa T.',
    role: 'WCP Parent',
  },
  {
    quote:
      'This school is truly our second home. I have absolutely loved being able to be in the class with my kids, meeting their friends and their friends’ parents, and watching them grow in such a loving environment.',
    author: 'Lexie Lenavitt',
    role: 'WCP Parent',
  },
  {
    quote:
      'This preschool has been a wonderful place for my two daughters. The teachers are loving, supportive, and truly care about the children. My shy little girl has grown so much — she now looks forward to coming to school every day.',
    author: 'Anita Shrestha',
    role: 'WCP Parent',
  },
  {
    quote:
      'Our son has been at WCP for 2 years and it has been amazing to see him thrive through making friends, growing in confidence, and forming a great bond with his teacher, Ms. Erin.',
    author: 'Sara Jane Nixon',
    role: 'WCP Parent',
    tags: ['twos', 'threes'],
  },
  {
    quote:
      'We LOVE WCP! Our daughter has been here for going on 3 years now. We’ve fostered friendships as parents. We love the connections, the events, the teachers. Everything!',
    author: 'Courtney Marquart',
    role: 'WCP Parent',
  },
  {
    quote:
      'I’m so grateful we found WCP. My little one has grown so much, learned so much, and loves his teachers. I love that I get to know them too, and get to know all the friends in class. The parents are so involved and dedicated, and for the teachers it is obviously their passion. We really could not have asked for a better experience — I only wish it was for more years.',
    author: 'Teresa Vasquez',
    role: 'WCP Parent',
  },
  {
    quote:
      'We love the community feel and how we get to be as involved as we want in our daughter’s classroom and the school itself. The teachers are incredible and truly care for each student.',
    author: 'Renee Ross',
    role: 'WCP Parent',
  },
];

/** The handful surfaced on the home page's short testimonial row. */
export const featuredTestimonials = testimonials.filter((t) => t.featured);

/** Quotes relevant to a given class page (falls back to general quotes). */
export function testimonialsByTag(tag: TestimonialTag): Testimonial[] {
  return testimonials.filter((t) => t.tags?.includes(tag));
}
