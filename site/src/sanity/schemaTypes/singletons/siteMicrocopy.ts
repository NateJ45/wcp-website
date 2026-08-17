import { defineType, defineField } from 'sanity';

// =============================================================================
// siteMicrocopy — the small bits of wording that live outside the page builder
// =============================================================================
// Most public copy is a page-builder section a volunteer can already edit. These
// few pieces are not, because they belong to code-owned utility pages: the
// "page not found" page, the thank-you page a family lands on after sending the
// contact form, and the footer sign-off.
//
// They are short, but the thank-you page in particular is the last thing a
// prospective family reads after reaching out, and "we will be in touch soon"
// is exactly the sort of promise a board might want to make more specific.
// Leaving it welded into a .astro file made that a developer's job.
//
// Every field is OPTIONAL: blank falls back to the wording committed in the
// page itself, so clearing one restores the default rather than emptying the
// page.
// =============================================================================
export const siteMicrocopy = defineType({
  name: 'siteMicrocopy',
  title: 'Small bits of wording',
  type: 'document',
  icon: () => '✍️',
  groups: [
    { name: 'thanks', title: 'After a form is sent', default: true },
    { name: 'notFound', title: 'Page not found' },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    // -- Thank-you page ------------------------------------------------------
    defineField({
      name: 'thanksEyebrow',
      title: 'Small line above the heading',
      type: 'string',
      group: 'thanks',
      description: 'e.g. "Message received".',
    }),
    defineField({
      name: 'thanksTitle',
      title: 'Heading',
      type: 'string',
      group: 'thanks',
      description: 'e.g. "Thank you".',
    }),
    defineField({
      name: 'thanksLead',
      title: 'Opening line',
      type: 'string',
      group: 'thanks',
      description: 'e.g. "Thanks for reaching out. We will be in touch soon."',
    }),
    defineField({
      name: 'thanksNote',
      title: 'Paragraph underneath',
      type: 'text',
      rows: 3,
      group: 'thanks',
      description:
        'The reassurance under the heading. If you promise a timeframe here, make sure it is one the board can keep.',
    }),

    defineField({
      name: 'tourThanksEyebrow',
      title: 'Small line above the heading (tour requests)',
      type: 'string',
      group: 'thanks',
      description:
        'A family who asked for a TOUR sees this instead of the wording above. e.g. "Tour request received".',
    }),
    defineField({
      name: 'tourThanksLead',
      title: 'Opening line (tour requests)',
      type: 'string',
      group: 'thanks',
    }),
    defineField({
      name: 'tourThanksNote',
      title: 'Paragraph underneath (tour requests)',
      type: 'text',
      rows: 3,
      group: 'thanks',
    }),

    // -- 404 -----------------------------------------------------------------
    defineField({
      name: 'notFoundChip',
      title: 'Small taped label',
      type: 'string',
      group: 'notFound',
      description: 'e.g. "Page not found".',
    }),
    defineField({
      name: 'notFoundHeading',
      title: 'Heading',
      type: 'string',
      group: 'notFound',
      description: 'Keep it light — a dead link is a small disappointment, not a crisis.',
    }),
    defineField({
      name: 'notFoundBody',
      title: 'Explanation',
      type: 'text',
      rows: 3,
      group: 'notFound',
    }),

    // -- Footer --------------------------------------------------------------
    defineField({
      name: 'footerSignOff',
      title: 'Footer sign-off',
      type: 'string',
      group: 'footer',
      description: 'The warm line at the foot of every page, e.g. "See you at drop-off!"',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Small bits of wording',
        subtitle: 'Thank-you page · Page not found · Footer sign-off',
      };
    },
  },
});
